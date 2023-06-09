import { Context, DynamoDBQueryRequest } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBQueryRequest {
  return {
    operation: "Query",
    index: "CommentsByPost",
    query: {
      expression: "#post = :post AND begins_with(#pk, :pk)",
      expressionNames: { "#post": "post", "#pk": "pk" },
      expressionValues: {
        ":post": { S: `POST#${ctx.arguments.id}` },
        ":pk": { S: "COMMENT#" }
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
