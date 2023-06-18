/**
 * TODO: Migrate to AWS Lambda
 */

import { Context, DynamoDBQueryRequest } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBQueryRequest {
  return {
    operation: "Query",
    query: {
      expression: "#pk = :pk AND begins_with(#sk, :sk)",
      expressionNames: { "#pk": "pk", "#sk": "sk" },
      expressionValues: {
        ":pk": { S: `POST#${ctx.arguments.postId}` },
        ":sk": { S: "COMMENT#" }
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
    const postId = pk.split("#")[1];

    return {
      id,
      postId,
      ...restOfItem
    };
  });

  return {
    cursor: nextToken,
    comments
  };
}
