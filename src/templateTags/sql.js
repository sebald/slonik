// @flow

import type {
  IdentifierTokenType,
  PrimitiveValueExpressionType,
  RawSqlTokenType,
  SqlFragmentType,
  SqlSqlTokenType,
  SqlTaggedTemplateType,
  TupleListSqlTokenType,
  TupleSqlTokenType,
  UnnestSqlTokenType,
  ValueExpressionType,
  ValueListSqlTokenType
} from '../types';
import {
  deepFreeze,
  isPrimitiveValueExpression
} from '../utilities';
import Logger from '../Logger';
import {
  createIdentifierSqlFragment,
  createRawSqlSqlFragment,
  createSqlSqlFragment,
  createTupleListSqlFragment,
  createTupleSqlFragment,
  createUnnestSqlFragment,
  createValueListSqlFragment
} from '../sqlFragmentFactories';
import {
  SqlTokenSymbol,
  RawSqlTokenSymbol,
  IdentifierTokenSymbol,
  ValueListTokenSymbol,
  TupleTokenSymbol,
  TupleListTokenSymbol,
  UnnestTokenSymbol
} from '../symbols';

const log = Logger.child({
  namespace: 'sql'
});

// $FlowFixMe
const sql: SqlTaggedTemplateType = (
  parts: $ReadOnlyArray<string>,
  ...values: $ReadOnlyArray<ValueExpressionType>
): SqlSqlTokenType => {
  let rawSql = '';

  const parameters = [];

  let index = 0;

  const appendSqlFragment = (sqlFragment: SqlFragmentType) => {
    rawSql += sqlFragment.sql;
    parameters.push(...sqlFragment.parameters);
  };

  for (const part of parts) {
    const token = values[index++];

    rawSql += part;

    if (index >= parts.length) {
      continue;
    }

    if (isPrimitiveValueExpression(token)) {
      rawSql += '$' + (parameters.length + 1);

      parameters.push(token);
    } else if (token && token.type === SqlTokenSymbol) {
      // @see https://github.com/gajus/slonik/issues/36 regarding FlowFixMe use.
      // $FlowFixMe
      appendSqlFragment(createSqlSqlFragment(token, parameters.length));
    } else if (token && token.type === RawSqlTokenSymbol) {
      // $FlowFixMe
      appendSqlFragment(createRawSqlSqlFragment(token, parameters.length));
    } else if (token && token.type === IdentifierTokenSymbol) {
      // $FlowFixMe
      appendSqlFragment(createIdentifierSqlFragment(token));
    } else if (token && token.type === ValueListTokenSymbol) {
      // $FlowFixMe
      appendSqlFragment(createValueListSqlFragment(token, parameters.length));
    } else if (token && token.type === TupleTokenSymbol) {
      // $FlowFixMe
      appendSqlFragment(createTupleSqlFragment(token, parameters.length));
    } else if (token && token.type === TupleListTokenSymbol) {
      // $FlowFixMe
      appendSqlFragment(createTupleListSqlFragment(token, parameters.length));
    } else if (token && token.type === UnnestTokenSymbol) {
      // $FlowFixMe
      appendSqlFragment(createUnnestSqlFragment(token, parameters.length));
    } else {
      log.error({
        constructedSql: rawSql,
        offendingToken: token
      }, 'unexpected value expression');

      throw new TypeError('Unexpected value expression.');
    }
  }

  const query = deepFreeze({
    sql: rawSql,
    type: SqlTokenSymbol,
    values: parameters
  });

  return query;
};

sql.identifier = (
  names: $ReadOnlyArray<string>
): IdentifierTokenType => {
  // @todo Replace `type` with a symbol once Flow adds symbol support
  // @see https://github.com/facebook/flow/issues/810
  return deepFreeze({
    names,
    type: IdentifierTokenSymbol
  });
};

sql.raw = (
  rawSql: string,
  values?: $ReadOnlyArray<PrimitiveValueExpressionType>
): RawSqlTokenType => {
  return deepFreeze({
    sql: rawSql,
    type: RawSqlTokenSymbol,
    values: values || []
  });
};

sql.valueList = (
  values: $ReadOnlyArray<PrimitiveValueExpressionType>
): ValueListSqlTokenType => {
  return deepFreeze({
    type: ValueListTokenSymbol,
    values
  });
};

sql.tuple = (
  values: $ReadOnlyArray<PrimitiveValueExpressionType>
): TupleSqlTokenType => {
  return deepFreeze({
    type: TupleTokenSymbol,
    values
  });
};

sql.tupleList = (
  tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>
): TupleListSqlTokenType => {
  return deepFreeze({
    tuples,
    type: TupleListTokenSymbol
  });
};

sql.unnest = (
  tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
  columnTypes: $ReadOnlyArray<string>
): UnnestSqlTokenType => {
  return deepFreeze({
    columnTypes,
    tuples,
    type: UnnestTokenSymbol
  });
};

export default sql;
