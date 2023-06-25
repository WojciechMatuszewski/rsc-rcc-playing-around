/**
 * TODO: Migrate to AWS Lambda
 */

import { Context, DynamoDBQueryRequest, runtime } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBQueryRequest {
  if (!ctx.source.id) {
    runtime.earlyReturn({
      items: [],
      nextToken: null
    });
  }

  return {
    operation: "Query",
    query: {
      expression: "#pk = :pk AND begins_with(#sk, :sk)",
      expressionNames: { "#pk": "pk", "#sk": "sk" },
      expressionValues: {
        ":pk": { S: `COMMENT#${ctx.source.id}` },
        ":sk": { S: "REPLY#" }
      }
    },
    scanIndexForward: false,
    limit: ctx.arguments.limit,
    nextToken: ctx.arguments.cursor
  };
}

export function response(ctx: Context) {
  const { items = [], nextToken } = ctx.result;
  const comments = items.map(({ sk, pk, ...restOfItem }) => {
    const id = sk.split("#")[1];

    return {
      id,
      ...restOfItem
    };
  });

  return {
    cursor: nextToken,
    comments
  };
}
