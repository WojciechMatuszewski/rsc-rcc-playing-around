import { Context, DynamoDBUpdateItemRequest } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  return {
    key: util.dynamodb.toMapValues({ pk: "POST", sk: ctx.arguments.id }),
    operation: "UpdateItem",
    update: {
      expression: "SET #downVotes = #downVotes - :incr",
      expressionNames: { "#downVotes": "downVotes" },
      expressionValues: { ":incr": { N: "1" } }
    },
    condition: {
      expression: "attribute_exists(#pk)",
      expressionNames: { "#pk": "pk" }
    }
  };
}

export function response(ctx: Context) {
  const { pk, sk, ...restOfItem } = ctx.result;
  return {
    id: sk,
    ...restOfItem
  };
}
