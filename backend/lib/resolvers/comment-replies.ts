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
        ":pk": { S: `COMMENT#${ctx.arguments.commentId}` },
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
  const replies = items.map(({ sk, pk, ...restOfItem }) => {
    const id = sk.split("#")[1];
    const commentId = pk.split("#")[1];

    return {
      id,
      commentId,
      ...restOfItem,
      __typename: "CommentReply"
    };
  });

  return {
    cursor: nextToken,
    replies
  };
}
