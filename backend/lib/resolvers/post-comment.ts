import { Context, DynamoDBGetItemRequest } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBGetItemRequest {
  return {
    operation: "GetItem",
    key: {
      pk: { S: `COMMENT#${ctx.arguments.id}` },
      sk: { S: `COMMENT#${ctx.arguments.id}` }
    }
  };
}

export function response(ctx: Context) {
  const { pk, sk, ...restOfItems } = ctx.result;
  return {
    id: ctx.arguments.id,
    ...restOfItems
  };
}
