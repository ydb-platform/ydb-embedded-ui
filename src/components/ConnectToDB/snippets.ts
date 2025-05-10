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
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	
	db, err := ydb.Open(context.Background(),
		"${endpoint ?? '<endpoint>'}${database ?? '/<database>'}",
		ydb.WithAccessTokenCredentials(os.Getenv("YDB_ACCESS_TOKEN_CREDENTIALS")),
	)
	if err != nil {
		panic(err)
	}

	defer db.Close(ctx)

	row, err := db.Query().QueryRow(ctx, "SELECT 'Hello, world!'")
	if err != nil {
		panic(err)
	}

	var val string
	if err := row.Scan(&val); err != nil {
		panic(err)
	}

	println(val)
}`;
}

export function getGoDatabaseSqlSnippetCode({database, endpoint}: SnippetParams) {
    return `package main

import (
	"context"
	"database/sql"
	"os"

	_ "github.com/ydb-platform/ydb-go-sdk/v3"
)

func main() {
	db, err := sql.Open("ydb", "${endpoint ?? '<endpoint>'}${database ?? '/<database>'}"+"?token="+os.Getenv("YDB_ACCESS_TOKEN_CREDENTIALS"))
	if err != nil {
		panic(err)
	}

	row := db.QueryRowContext(context.Background(), "SELECT 'Hello, world!'")

	var val string
	if err := row.Scan(&val); err != nil {
		panic(err)
	}

	println(val)
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
    return `const {Driver, getCredentialsFromEnv, getLogger} = require('ydb-sdk');

const logger = getLogger({level: 'debug'});
const endpoint = '${endpoint ?? '<endpoint>'}';
const database = '${database ?? '/<database>'}';
const authService = getCredentialsFromEnv();
const driver = new Driver({endpoint, database, authService});

async function run() {
  if (!await driver.ready(100)) {
      logger.fatal('Driver has not become ready in 10 seconds!');
      process.exit(1);
  }

  await driver.tableClient.withSession(async (session) => {
      res = await session.executeQuery("SELECT 'Hello, world!'")
      console.log(res.resultSets[0].rows[0].items[0].bytesValue.toString())
      return
  });

  process.exit(0)
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

    'credentials' => new AccessTokenAuthentication('<token>') // use from reference/ydb-sdk/auth
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
        case 'go (native SDK)': {
            return getGoSnippetCode(params);
        }
        case 'go (database/sql)': {
            return getGoDatabaseSqlSnippetCode(params);
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
