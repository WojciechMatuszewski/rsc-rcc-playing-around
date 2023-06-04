import { gql } from "@apollo/client";

export const postFragment = gql`
  fragment postFragment on Post {
    id
    title
    author
    upVotes
    downVotes
  }
`;

export const getRSCPaginationPostsQuery = gql`
  ${postFragment}
  query getRSCPaginationPostsQuery($cursor: String, $limit: Int!) {
    posts(cursor: $cursor, limit: $limit) {
      posts {
        ...postFragment
      }
      cursor
    }
  }
`;

export const getSSRPaginationPostsQuery = gql`
  ${postFragment}
  query getSSRPaginationPostsQuery($cursor: String, $limit: Int!) {
    posts(cursor: $cursor, limit: $limit) {
      posts {
        ...postFragment
      }
      cursor
    }
  }
`;
