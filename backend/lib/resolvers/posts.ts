// const dynamoDBClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// export const handler: AppSyncResolverHandler<any, any> = async ({
//   arguments: { limit: originalLimit, cursor }
// }) => {
//   const limit = originalLimit + 1;
//   const exclusiveStartKey = cursor
//     ? JSON.parse(Buffer.from(cursor, "base64").toString("utf8"))
//     : undefined;

//   const { Items: items = [] } = await dynamoDBClient.send(
//     new QueryCommand({
//       TableName: process.env.TABLE_NAME,
//       KeyConditionExpression: "#pk = :pk",
//       ExpressionAttributeNames: {
//         "#pk": "pk"
//       },
//       ExpressionAttributeValues: {
//         ":pk": "POST"
//       },
//       Limit: limit,
//       ExclusiveStartKey: exclusiveStartKey,
//       ScanIndexForward: false
//     })
//   );

//   if (items.length > originalLimit) {
//     items.pop();

//     const newCursorBase = JSON.stringify({
//       pk: items[items.length - 1].pk,
//       sk: items[items.length - 1].sk
//     });
//     const newCursor = Buffer.from(newCursorBase).toString("base64");

//     return {
//       cursor: newCursor,
//       posts: items.map(({ sk, pk, ...restOfItem }) => {
//         return {
//           id: sk,
//           ...restOfItem
//         };
//       })
//     };
//   }

//   return {
//     cursor: undefined,
//     posts: items.map(({ sk, pk, ...restOfItem }) => {
//       return {
//         id: sk,
//         ...restOfItem
//       };
//     })
//   };
// };

import { Context, DynamoDBQueryRequest } from "@aws-appsync/utils";

export function request(ctx: Context): DynamoDBQueryRequest {
  return {
    operation: "Query",
    index: "PostsByEpoch",
    query: {
      expression: "#postsPk = :postsPk",
      expressionNames: { "#postsPk": "postsPk" },
      expressionValues: { ":postsPk": { S: "POST" } }
    },
    scanIndexForward: false,
    limit: ctx.arguments.limit,
    nextToken: ctx.arguments.cursor
  };
}

export function response(ctx: Context) {
  if (ctx.error) {
    util.error(ctx.error.message);
  }

  const { items = [], nextToken } = ctx.result;
  const posts = items.map(({ sk, pk, ...restOfItem }) => {
    return {
      id: pk.split("#")[1],
      ...restOfItem
    };
  });

  return {
    cursor: nextToken,
    posts
  };
}
