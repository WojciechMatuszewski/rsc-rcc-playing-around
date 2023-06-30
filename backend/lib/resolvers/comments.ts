import { Context, DynamoDBQueryRequest, runtime } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBQueryRequest {
  if (!ctx.source.id) {
    runtime.earlyReturn({
      replies: [],
      cursor: null
    });
  }

  return {
    operation: "Query",
    index: "RepliesByComment",
    query: {
      expression: "#reply = :reply AND begins_with(#pk, :pk)",
      expressionNames: { "#reply": "reply", "#pk": "pk" },
      expressionValues: {
        ":reply": { S: `COMMENT#${ctx.source.id}` },
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
