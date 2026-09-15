import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {collectReports, sanitizeArtifacts, summarize, verifyImage} from '../release-e2e-report';

const index = '<html>shipped UI</html>';
const provenance = {
    ydb_sha: 'a'.repeat(40),
    image_digest: `sha256:${'b'.repeat(64)}`,
    index_sha256: createHash('sha256').update(index).digest('hex'),
};
const image = {
    Id: 'sha256:container-image',
    RepoDigests: [`ghcr.io/ydb-platform/local-ydb@${provenance.image_digest}`],
    Config: {Labels: {'ydb.revision': provenance.ydb_sha}},
};
const shards = () =>
    Array.from({length: 8}, (_, i) => ({
        shard: i + 1,
        setup: 'success',
        identity: 'success',
        tests: 'success',
        image_digest: provenance.image_digest,
        blobs: 1,
    }));
const report = {stats: {expected: 80, unexpected: 0, flaky: 0, skipped: 2}, errors: []};

describe('release image proof', () => {
    test('verifies the running image and exact served HTML', () => {
        expect(verifyImage(provenance, {Image: image.Id}, image, index)).toMatchObject({
            image_digest: provenance.image_digest,
            index_verified: true,
        });
    });
    test('rejects a different image, revision, or served UI', () => {
        expect(() => verifyImage(provenance, {Image: 'other'}, image, index)).toThrow('digest');
        expect(() =>
            verifyImage(provenance, {Image: image.Id}, {...image, RepoDigests: []}, index),
        ).toThrow('digest');
        expect(() =>
            verifyImage(provenance, {Image: image.Id}, {...image, Config: {Labels: {}}}, index),
        ).toThrow('revision');
        expect(() =>
            verifyImage(provenance, {Image: image.Id}, image, '<html>dev UI</html>'),
        ).toThrow('Served');
    });
});

describe('report completeness', () => {
    test('removes artifact links without reading or modifying their targets', () => {
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-artifact-test-'));
        try {
            const artifacts = path.join(directory, 'artifacts');
            fs.mkdirSync(artifacts);
            const outside = path.join(directory, 'runner-file');
            fs.writeFileSync(outside, 'private fixture');
            fs.symlinkSync(outside, path.join(artifacts, 'unsafe.txt'));
            fs.writeFileSync(path.join(artifacts, 'result.json'), '{}');
            const errors = sanitizeArtifacts(artifacts);
            expect(errors).toEqual([path.join(artifacts, 'unsafe.txt')]);
            expect(fs.readFileSync(outside, 'utf8')).toBe('private fixture');
            expect(fs.readdirSync(artifacts)).toEqual(['result.json']);
            expect(summarize(shards(), report, provenance, errors).status).toBe('incomplete');
            const records = shards();
            Object.assign(records[0], {artifact_errors: errors});
            expect(summarize(records, report, provenance).status).toBe('incomplete');
        } finally {
            fs.rmSync(directory, {recursive: true, force: true});
        }
    });
    test('passes only a complete successful run', () => {
        expect(summarize(shards(), report, provenance)).toMatchObject({
            status: 'passed',
            complete: true,
        });
    });
    test('retains genuine test failures as a complete failed run', () => {
        const records = shards();
        records[2].tests = 'failure';
        expect(
            summarize(records, {...report, stats: {...report.stats, unexpected: 3}}, provenance),
        ).toMatchObject({status: 'failed', complete: true});
    });
    test.each(['setup', 'identity', 'tests'])('a skipped %s step cannot pass', (step) => {
        const records = shards();
        Object.assign(records[2], {[step]: 'skipped'});
        expect(summarize(records, report, provenance)).toMatchObject({
            status: 'incomplete',
            complete: false,
        });
    });
    test('detects missing, duplicate and wrong-image shard reports', () => {
        for (const patch of [{blobs: 0}, {blobs: 2}, {image_digest: 'other'}]) {
            const records = shards();
            Object.assign(records[3], patch);
            expect(summarize(records, report, provenance).status).toBe('incomplete');
        }
    });
    test('does not greenwash missing reports, setup errors or an all-skipped run', () => {
        expect(summarize([], report, provenance).status).toBe('incomplete');
        expect(summarize(shards(), undefined, provenance).status).toBe('incomplete');
        expect(summarize(shards(), report, undefined).status).toBe('incomplete');
        expect(
            summarize(shards(), {...report, errors: [{message: 'global setup failed'}]}, provenance)
                .status,
        ).toBe('incomplete');
        expect(
            summarize(shards(), {...report, stats: {...report.stats, expected: 0}}, provenance)
                .status,
        ).toBe('incomplete');
    });
    test('collects available blobs and reports all eight shards when one upload is absent', () => {
        const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'release-e2e-test-'));
        try {
            const shard = path.join(directory, 'release-e2e-shard-1');
            fs.mkdirSync(path.join(shard, 'release-artifacts'), {recursive: true});
            fs.mkdirSync(path.join(shard, 'ui', 'blob-report'), {recursive: true});
            fs.writeFileSync(
                path.join(shard, 'release-artifacts', 'shard.json'),
                JSON.stringify(shards()[0]),
            );
            fs.writeFileSync(path.join(shard, 'ui', 'blob-report', 'report.zip'), 'blob');
            const destination = path.join(directory, 'merged');
            const records = collectReports(directory, destination);
            expect(records).toHaveLength(8);
            expect(records[0].blobs).toBe(1);
            expect(records[1]).toMatchObject({shard: 2, blobs: 0, error: expect.any(String)});
            expect(fs.readdirSync(destination)).toEqual(['1-report.zip']);
            expect(summarize(records, report, provenance).status).toBe('incomplete');
        } finally {
            fs.rmSync(directory, {recursive: true, force: true});
        }
    });
});
