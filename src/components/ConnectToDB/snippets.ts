import type {SnippetLanguage, SnippetParams} from './types';
import {prepareEndpoint} from './utils';

export function getBashSnippetCode({database, endpoint}: SnippetParams) {
    return `ydb -e ${endpoint || '<endpoint>'} --token-file ~/my_token
    -d ${database ?? '/<database>'} table query execute -q 'SELECT "Hello, world!"'`;
}

export function getCPPSnippetCode({database, endpoint}: SnippetParams) {
    return `auto connectionParams = TConnectionsParams()
    .SetEndpoint("${endpoint ?? '<endpoint>'}")
    .SetDatabase("${database ?? '/<database>'}")
    .SetAuthToken(GetEnv("YDB_TOKEN"));

TDriver driver(connectionParams);`;
}

export function getCSharpSnippetCode({database, endpoint}: SnippetParams) {
    return `var config = new DriverConfig(
    endpoint: "${endpoint ?? '<endpoint>'}",
    database: "${database ?? '/<database>'}",
    credentials: credentialsProvider
);

using var driver = new Driver(
    config: config
);

await driver.Initialize();`;
}

export function getGoSnippetCode({database, endpoint}: SnippetParams) {
    return `package main

import (
    "context"
    "os"

    "github.com/ydb-platform/ydb-go-sdk/v3"
    "github.com/ydb-platform/ydb-go-sdk/v3/table"
)

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    db, err := ydb.Open(ctx,
        "${endpoint ?? '<endpoint>'}${database ?? '/<database>'}",
        ydb.WithAccessTokenCredentials(os.Getenv("YDB_ACCESS_TOKEN_CREDENTIALS")),
    )
    if err != nil {
        panic(err)
    }

    defer db.Close(ctx)

    err = db.Table().Do(ctx,
        func(ctx context.Context, s table.Session) error {
            _, res, err := s.Execute(
                ctx,
                table.TxControl(table.BeginTx(table.WithOnlineReadOnly()), table.CommitTx()),
                "SELECT 'Hello, world!'",
                nil,
            )
            if err != nil {
                return err
            }
            defer res.Close()
            var val string

            for res.NextResultSet(ctx) {
                for res.NextRow() {
                    err = res.Scan(&val)
                    if err != nil {
                        return err
                    }
                    println(val)
                }
            }
            return res.Err()
        })
    if err != nil {
        panic(err)
    }
}`;
}

export function getJavaSnippetCode({database, endpoint}: SnippetParams) {
    return `package com.example;

import java.io.IOException;
import java.nio.charset.Charset;

import tech.ydb.core.grpc.GrpcTransport;
import tech.ydb.table.SessionRetryContext;
import tech.ydb.table.TableClient;
import tech.ydb.table.query.DataQueryResult;
import tech.ydb.table.result.ResultSetReader;
import tech.ydb.table.transaction.TxControl;
import tech.ydb.auth.TokenAuthProvider;

public class YDBConnect {
    public static void main(String[] args) throws IOException {
        try (GrpcTransport transport = GrpcTransport.forEndpoint(
                "${endpoint ?? '<endpoint>'}",
                "${database ?? '/<database>'}")
                .withAuthProvider(new TokenAuthProvider(System.getenv("YDB_ACCESS_TOKEN_CREDENTIALS")))
                .build()) {
            try (TableClient tableClient = TableClient.newClient(transport)
                    .build()) {
                SessionRetryContext retryCtx = SessionRetryContext.create(tableClient).build();
                DataQueryResult queryResult = retryCtx.supplyResult(
                    session -> session.executeDataQuery("SELECT 'Hello, world!'", TxControl.serializableRw())
                ).join().getValue();

                ResultSetReader rsReader = queryResult.getResultSet(0);
                while (rsReader.next()) {
                    System.out.println(rsReader.getColumn(0).getBytesAsString(Charset.forName("utf8")));
                }
            }
        }
    }
}`;
}

export function getNodeJSSnippetCode({database, endpoint}: SnippetParams) {
    return `// Requires Node.js 20.19 or higher (also works with Deno/Bun)
// Documentation: https://ydb.js.org
// Source code: https://github.com/ydb-platform/ydb-js-sdk
// Examples: https://github.com/ydb-platform/ydb-js-examples
import {Driver} from '@ydbjs/core';
import {query} from '@ydbjs/query';
import type {ResultSet} from '@ydbjs/query';

const connectionString = '${endpoint ?? '<endpoint>'}${database ?? '/<database>'}';

const driver = new Driver(connectionString);

async function run() {
  await driver.ready();
  const sql = query(driver);

  const resultSets: ResultSet[] = await sql\`SELECT 'Hello, world!' AS message;\`;
  console.log(resultSets[0].rows[0].message);

  await driver.close();
}

run();`;
}

export function getPHPSnippetCode({database, endpoint}: SnippetParams) {
    return `<?php

use YdbPlatform\\Ydb\\Ydb;

$config = [
    // Database path
    'database'    => '${database ?? '/<database>'}',

    // Database endpoint
    'endpoint'    => '${endpoint ?? '<endpoint>'}',

    // Auto discovery (dedicated server only)
    'discovery'   => false,

    // IAM config
    'iam_config'  => [
        // 'root_cert_file' => './CA.pem',  Root CA file (uncomment for dedicated server only)
    ],

    'credentials' => new AccessTokenAuthentication('<token>')
];

$ydb = new Ydb($config);`;
}

export function getPythonSnippetCode({database, endpoint}: SnippetParams) {
    return `#!/usr/bin/python3
import ydb

driver_config = ydb.DriverConfig(
    '${endpoint || '<endpoint>'}', '${database ?? '/<database>'}',
    credentials=ydb.credentials_from_env_variables(),
)
print(driver_config)
with ydb.Driver(driver_config) as driver:
    try:
        driver.wait(10)
        session = driver.table_client.session().create()
        with session.transaction() as tx:
            query = "SELECT 'Hello, world!'"
            result_set = tx.execute(query)[0]
            for row in result_set.rows:
                print(row)
    except TimeoutError:
        print("Connect failed to YDB")
        print("Last reported errors by discovery:")
        print(driver.discovery_debug_details())`;
}

export function getSnippetCode(lang: SnippetLanguage, rawParams: SnippetParams) {
    const params = {
        ...rawParams,
        endpoint: prepareEndpoint(rawParams.endpoint),
    };

    switch (lang) {
        case 'cpp': {
            return getCPPSnippetCode(params);
        }
        case 'csharp': {
            return getCSharpSnippetCode(params);
        }
        case 'go': {
            return getGoSnippetCode(params);
        }
        case 'java': {
            return getJavaSnippetCode(params);
        }
        case 'javascript': {
            return getNodeJSSnippetCode(params);
        }
        case 'php': {
            return getPHPSnippetCode(params);
        }
        case 'python': {
            return getPythonSnippetCode(params);
        }
        case 'bash':
        default: {
            return getBashSnippetCode(params);
        }
    }
}
