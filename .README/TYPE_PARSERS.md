## Type parsers

Type parsers describe how to parse PostgreSQL types.

```js
type TypeParserType = {|
  +name: string,
  +parse: (value: string) => *
|};

```

Example:

```js
{
  name: 'int8',
  parse: (value) => {
    return parseInt(value, 10);
  }
}

```

Note: Unlike [`pg-types`](https://github.com/brianc/node-pg-types) that uses OIDs to identify types, Slonik identifies types using their names.

Type parsers are configured using [`typeParsers` client configuration](#slonik-usage-api).

Read: [Default type parsers](#default-type-parsers).

### Built-in type parsers

||Type name|Implemnetation|Factory function name|
|---|---|---|
|`int8`|Produces an integer.|`createBigintTypeParser`|
|`timestamp`|Produces a unix timestamp (in milliseconds).|`createTimestampTypeParser`|
|`timestamptz`|Produces a unix timestamp (in milliseconds).|`createTimestampWithTimeZoneParser`|

Built-in type parsers can be created using the exported factory functions, e.g.

```js
import {
  createTimestampTypeParser
} from 'slonik';

createTimestampTypeParser();

// {
//   name: 'timestamp',
//   parse: (value) => {
//     return value === null ? value : Date.parse(value);
//   }
// }

```
