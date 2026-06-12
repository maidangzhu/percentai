
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Log
 * 
 */
export type Log = $Result.DefaultSelection<Prisma.$LogPayload>
/**
 * Model Person
 * 
 */
export type Person = $Result.DefaultSelection<Prisma.$PersonPayload>
/**
 * Model ChatTurn
 * 
 */
export type ChatTurn = $Result.DefaultSelection<Prisma.$ChatTurnPayload>
/**
 * Model ChatMessage
 * 
 */
export type ChatMessage = $Result.DefaultSelection<Prisma.$ChatMessagePayload>
/**
 * Model Task
 * 
 */
export type Task = $Result.DefaultSelection<Prisma.$TaskPayload>
/**
 * Model AgentSession
 * 
 */
export type AgentSession = $Result.DefaultSelection<Prisma.$AgentSessionPayload>
/**
 * Model AgentMessage
 * 
 */
export type AgentMessage = $Result.DefaultSelection<Prisma.$AgentMessagePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Logs
 * const logs = await prisma.log.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Logs
   * const logs = await prisma.log.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.log`: Exposes CRUD operations for the **Log** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Logs
    * const logs = await prisma.log.findMany()
    * ```
    */
  get log(): Prisma.LogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.person`: Exposes CRUD operations for the **Person** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more People
    * const people = await prisma.person.findMany()
    * ```
    */
  get person(): Prisma.PersonDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.chatTurn`: Exposes CRUD operations for the **ChatTurn** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ChatTurns
    * const chatTurns = await prisma.chatTurn.findMany()
    * ```
    */
  get chatTurn(): Prisma.ChatTurnDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.chatMessage`: Exposes CRUD operations for the **ChatMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ChatMessages
    * const chatMessages = await prisma.chatMessage.findMany()
    * ```
    */
  get chatMessage(): Prisma.ChatMessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.task`: Exposes CRUD operations for the **Task** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tasks
    * const tasks = await prisma.task.findMany()
    * ```
    */
  get task(): Prisma.TaskDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.agentSession`: Exposes CRUD operations for the **AgentSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AgentSessions
    * const agentSessions = await prisma.agentSession.findMany()
    * ```
    */
  get agentSession(): Prisma.AgentSessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.agentMessage`: Exposes CRUD operations for the **AgentMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AgentMessages
    * const agentMessages = await prisma.agentMessage.findMany()
    * ```
    */
  get agentMessage(): Prisma.AgentMessageDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Log: 'Log',
    Person: 'Person',
    ChatTurn: 'ChatTurn',
    ChatMessage: 'ChatMessage',
    Task: 'Task',
    AgentSession: 'AgentSession',
    AgentMessage: 'AgentMessage'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "log" | "person" | "chatTurn" | "chatMessage" | "task" | "agentSession" | "agentMessage"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Log: {
        payload: Prisma.$LogPayload<ExtArgs>
        fields: Prisma.LogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          findFirst: {
            args: Prisma.LogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          findMany: {
            args: Prisma.LogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>[]
          }
          create: {
            args: Prisma.LogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          createMany: {
            args: Prisma.LogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>[]
          }
          delete: {
            args: Prisma.LogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          update: {
            args: Prisma.LogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          deleteMany: {
            args: Prisma.LogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>[]
          }
          upsert: {
            args: Prisma.LogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LogPayload>
          }
          aggregate: {
            args: Prisma.LogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLog>
          }
          groupBy: {
            args: Prisma.LogGroupByArgs<ExtArgs>
            result: $Utils.Optional<LogGroupByOutputType>[]
          }
          count: {
            args: Prisma.LogCountArgs<ExtArgs>
            result: $Utils.Optional<LogCountAggregateOutputType> | number
          }
        }
      }
      Person: {
        payload: Prisma.$PersonPayload<ExtArgs>
        fields: Prisma.PersonFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PersonFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PersonFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>
          }
          findFirst: {
            args: Prisma.PersonFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PersonFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>
          }
          findMany: {
            args: Prisma.PersonFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>[]
          }
          create: {
            args: Prisma.PersonCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>
          }
          createMany: {
            args: Prisma.PersonCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PersonCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>[]
          }
          delete: {
            args: Prisma.PersonDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>
          }
          update: {
            args: Prisma.PersonUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>
          }
          deleteMany: {
            args: Prisma.PersonDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PersonUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PersonUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>[]
          }
          upsert: {
            args: Prisma.PersonUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>
          }
          aggregate: {
            args: Prisma.PersonAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePerson>
          }
          groupBy: {
            args: Prisma.PersonGroupByArgs<ExtArgs>
            result: $Utils.Optional<PersonGroupByOutputType>[]
          }
          count: {
            args: Prisma.PersonCountArgs<ExtArgs>
            result: $Utils.Optional<PersonCountAggregateOutputType> | number
          }
        }
      }
      ChatTurn: {
        payload: Prisma.$ChatTurnPayload<ExtArgs>
        fields: Prisma.ChatTurnFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChatTurnFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChatTurnFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload>
          }
          findFirst: {
            args: Prisma.ChatTurnFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChatTurnFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload>
          }
          findMany: {
            args: Prisma.ChatTurnFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload>[]
          }
          create: {
            args: Prisma.ChatTurnCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload>
          }
          createMany: {
            args: Prisma.ChatTurnCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChatTurnCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload>[]
          }
          delete: {
            args: Prisma.ChatTurnDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload>
          }
          update: {
            args: Prisma.ChatTurnUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload>
          }
          deleteMany: {
            args: Prisma.ChatTurnDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChatTurnUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ChatTurnUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload>[]
          }
          upsert: {
            args: Prisma.ChatTurnUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatTurnPayload>
          }
          aggregate: {
            args: Prisma.ChatTurnAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChatTurn>
          }
          groupBy: {
            args: Prisma.ChatTurnGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChatTurnGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChatTurnCountArgs<ExtArgs>
            result: $Utils.Optional<ChatTurnCountAggregateOutputType> | number
          }
        }
      }
      ChatMessage: {
        payload: Prisma.$ChatMessagePayload<ExtArgs>
        fields: Prisma.ChatMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ChatMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ChatMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          findFirst: {
            args: Prisma.ChatMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ChatMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          findMany: {
            args: Prisma.ChatMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>[]
          }
          create: {
            args: Prisma.ChatMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          createMany: {
            args: Prisma.ChatMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ChatMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>[]
          }
          delete: {
            args: Prisma.ChatMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          update: {
            args: Prisma.ChatMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          deleteMany: {
            args: Prisma.ChatMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ChatMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ChatMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>[]
          }
          upsert: {
            args: Prisma.ChatMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ChatMessagePayload>
          }
          aggregate: {
            args: Prisma.ChatMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateChatMessage>
          }
          groupBy: {
            args: Prisma.ChatMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<ChatMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.ChatMessageCountArgs<ExtArgs>
            result: $Utils.Optional<ChatMessageCountAggregateOutputType> | number
          }
        }
      }
      Task: {
        payload: Prisma.$TaskPayload<ExtArgs>
        fields: Prisma.TaskFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TaskFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TaskFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          findFirst: {
            args: Prisma.TaskFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TaskFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          findMany: {
            args: Prisma.TaskFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>[]
          }
          create: {
            args: Prisma.TaskCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          createMany: {
            args: Prisma.TaskCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TaskCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>[]
          }
          delete: {
            args: Prisma.TaskDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          update: {
            args: Prisma.TaskUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          deleteMany: {
            args: Prisma.TaskDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TaskUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TaskUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>[]
          }
          upsert: {
            args: Prisma.TaskUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TaskPayload>
          }
          aggregate: {
            args: Prisma.TaskAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTask>
          }
          groupBy: {
            args: Prisma.TaskGroupByArgs<ExtArgs>
            result: $Utils.Optional<TaskGroupByOutputType>[]
          }
          count: {
            args: Prisma.TaskCountArgs<ExtArgs>
            result: $Utils.Optional<TaskCountAggregateOutputType> | number
          }
        }
      }
      AgentSession: {
        payload: Prisma.$AgentSessionPayload<ExtArgs>
        fields: Prisma.AgentSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AgentSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AgentSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload>
          }
          findFirst: {
            args: Prisma.AgentSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AgentSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload>
          }
          findMany: {
            args: Prisma.AgentSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload>[]
          }
          create: {
            args: Prisma.AgentSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload>
          }
          createMany: {
            args: Prisma.AgentSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AgentSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload>[]
          }
          delete: {
            args: Prisma.AgentSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload>
          }
          update: {
            args: Prisma.AgentSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload>
          }
          deleteMany: {
            args: Prisma.AgentSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AgentSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AgentSessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload>[]
          }
          upsert: {
            args: Prisma.AgentSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentSessionPayload>
          }
          aggregate: {
            args: Prisma.AgentSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAgentSession>
          }
          groupBy: {
            args: Prisma.AgentSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<AgentSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.AgentSessionCountArgs<ExtArgs>
            result: $Utils.Optional<AgentSessionCountAggregateOutputType> | number
          }
        }
      }
      AgentMessage: {
        payload: Prisma.$AgentMessagePayload<ExtArgs>
        fields: Prisma.AgentMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AgentMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AgentMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload>
          }
          findFirst: {
            args: Prisma.AgentMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AgentMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload>
          }
          findMany: {
            args: Prisma.AgentMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload>[]
          }
          create: {
            args: Prisma.AgentMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload>
          }
          createMany: {
            args: Prisma.AgentMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AgentMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload>[]
          }
          delete: {
            args: Prisma.AgentMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload>
          }
          update: {
            args: Prisma.AgentMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload>
          }
          deleteMany: {
            args: Prisma.AgentMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AgentMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AgentMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload>[]
          }
          upsert: {
            args: Prisma.AgentMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AgentMessagePayload>
          }
          aggregate: {
            args: Prisma.AgentMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAgentMessage>
          }
          groupBy: {
            args: Prisma.AgentMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<AgentMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.AgentMessageCountArgs<ExtArgs>
            result: $Utils.Optional<AgentMessageCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    log?: LogOmit
    person?: PersonOmit
    chatTurn?: ChatTurnOmit
    chatMessage?: ChatMessageOmit
    task?: TaskOmit
    agentSession?: AgentSessionOmit
    agentMessage?: AgentMessageOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type LogCountOutputType
   */

  export type LogCountOutputType = {
    chatTurns: number
    tasks: number
  }

  export type LogCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chatTurns?: boolean | LogCountOutputTypeCountChatTurnsArgs
    tasks?: boolean | LogCountOutputTypeCountTasksArgs
  }

  // Custom InputTypes
  /**
   * LogCountOutputType without action
   */
  export type LogCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LogCountOutputType
     */
    select?: LogCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * LogCountOutputType without action
   */
  export type LogCountOutputTypeCountChatTurnsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChatTurnWhereInput
  }

  /**
   * LogCountOutputType without action
   */
  export type LogCountOutputTypeCountTasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskWhereInput
  }


  /**
   * Count Type PersonCountOutputType
   */

  export type PersonCountOutputType = {
    chatTurns: number
    tasks: number
  }

  export type PersonCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chatTurns?: boolean | PersonCountOutputTypeCountChatTurnsArgs
    tasks?: boolean | PersonCountOutputTypeCountTasksArgs
  }

  // Custom InputTypes
  /**
   * PersonCountOutputType without action
   */
  export type PersonCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PersonCountOutputType
     */
    select?: PersonCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PersonCountOutputType without action
   */
  export type PersonCountOutputTypeCountChatTurnsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChatTurnWhereInput
  }

  /**
   * PersonCountOutputType without action
   */
  export type PersonCountOutputTypeCountTasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskWhereInput
  }


  /**
   * Count Type ChatTurnCountOutputType
   */

  export type ChatTurnCountOutputType = {
    messages: number
    tasks: number
  }

  export type ChatTurnCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | ChatTurnCountOutputTypeCountMessagesArgs
    tasks?: boolean | ChatTurnCountOutputTypeCountTasksArgs
  }

  // Custom InputTypes
  /**
   * ChatTurnCountOutputType without action
   */
  export type ChatTurnCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurnCountOutputType
     */
    select?: ChatTurnCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ChatTurnCountOutputType without action
   */
  export type ChatTurnCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChatMessageWhereInput
  }

  /**
   * ChatTurnCountOutputType without action
   */
  export type ChatTurnCountOutputTypeCountTasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskWhereInput
  }


  /**
   * Count Type AgentSessionCountOutputType
   */

  export type AgentSessionCountOutputType = {
    messages: number
  }

  export type AgentSessionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | AgentSessionCountOutputTypeCountMessagesArgs
  }

  // Custom InputTypes
  /**
   * AgentSessionCountOutputType without action
   */
  export type AgentSessionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSessionCountOutputType
     */
    select?: AgentSessionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AgentSessionCountOutputType without action
   */
  export type AgentSessionCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgentMessageWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Log
   */

  export type AggregateLog = {
    _count: LogCountAggregateOutputType | null
    _min: LogMinAggregateOutputType | null
    _max: LogMaxAggregateOutputType | null
  }

  export type LogMinAggregateOutputType = {
    id: string | null
    occurredAt: Date | null
    appName: string | null
    appBundleId: string | null
    isSend: boolean | null
    isWechat: boolean | null
    screenshotPath: string | null
    createdAt: Date | null
  }

  export type LogMaxAggregateOutputType = {
    id: string | null
    occurredAt: Date | null
    appName: string | null
    appBundleId: string | null
    isSend: boolean | null
    isWechat: boolean | null
    screenshotPath: string | null
    createdAt: Date | null
  }

  export type LogCountAggregateOutputType = {
    id: number
    occurredAt: number
    appName: number
    appBundleId: number
    isSend: number
    isWechat: number
    screenshotPath: number
    createdAt: number
    _all: number
  }


  export type LogMinAggregateInputType = {
    id?: true
    occurredAt?: true
    appName?: true
    appBundleId?: true
    isSend?: true
    isWechat?: true
    screenshotPath?: true
    createdAt?: true
  }

  export type LogMaxAggregateInputType = {
    id?: true
    occurredAt?: true
    appName?: true
    appBundleId?: true
    isSend?: true
    isWechat?: true
    screenshotPath?: true
    createdAt?: true
  }

  export type LogCountAggregateInputType = {
    id?: true
    occurredAt?: true
    appName?: true
    appBundleId?: true
    isSend?: true
    isWechat?: true
    screenshotPath?: true
    createdAt?: true
    _all?: true
  }

  export type LogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Log to aggregate.
     */
    where?: LogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logs to fetch.
     */
    orderBy?: LogOrderByWithRelationInput | LogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Logs
    **/
    _count?: true | LogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LogMaxAggregateInputType
  }

  export type GetLogAggregateType<T extends LogAggregateArgs> = {
        [P in keyof T & keyof AggregateLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLog[P]>
      : GetScalarType<T[P], AggregateLog[P]>
  }




  export type LogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LogWhereInput
    orderBy?: LogOrderByWithAggregationInput | LogOrderByWithAggregationInput[]
    by: LogScalarFieldEnum[] | LogScalarFieldEnum
    having?: LogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LogCountAggregateInputType | true
    _min?: LogMinAggregateInputType
    _max?: LogMaxAggregateInputType
  }

  export type LogGroupByOutputType = {
    id: string
    occurredAt: Date
    appName: string
    appBundleId: string
    isSend: boolean
    isWechat: boolean
    screenshotPath: string | null
    createdAt: Date
    _count: LogCountAggregateOutputType | null
    _min: LogMinAggregateOutputType | null
    _max: LogMaxAggregateOutputType | null
  }

  type GetLogGroupByPayload<T extends LogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LogGroupByOutputType[P]>
            : GetScalarType<T[P], LogGroupByOutputType[P]>
        }
      >
    >


  export type LogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    occurredAt?: boolean
    appName?: boolean
    appBundleId?: boolean
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: boolean
    createdAt?: boolean
    chatTurns?: boolean | Log$chatTurnsArgs<ExtArgs>
    tasks?: boolean | Log$tasksArgs<ExtArgs>
    _count?: boolean | LogCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["log"]>

  export type LogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    occurredAt?: boolean
    appName?: boolean
    appBundleId?: boolean
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["log"]>

  export type LogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    occurredAt?: boolean
    appName?: boolean
    appBundleId?: boolean
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["log"]>

  export type LogSelectScalar = {
    id?: boolean
    occurredAt?: boolean
    appName?: boolean
    appBundleId?: boolean
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: boolean
    createdAt?: boolean
  }

  export type LogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "occurredAt" | "appName" | "appBundleId" | "isSend" | "isWechat" | "screenshotPath" | "createdAt", ExtArgs["result"]["log"]>
  export type LogInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chatTurns?: boolean | Log$chatTurnsArgs<ExtArgs>
    tasks?: boolean | Log$tasksArgs<ExtArgs>
    _count?: boolean | LogCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type LogIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type LogIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $LogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Log"
    objects: {
      chatTurns: Prisma.$ChatTurnPayload<ExtArgs>[]
      tasks: Prisma.$TaskPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      occurredAt: Date
      appName: string
      appBundleId: string
      isSend: boolean
      isWechat: boolean
      screenshotPath: string | null
      createdAt: Date
    }, ExtArgs["result"]["log"]>
    composites: {}
  }

  type LogGetPayload<S extends boolean | null | undefined | LogDefaultArgs> = $Result.GetResult<Prisma.$LogPayload, S>

  type LogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LogCountAggregateInputType | true
    }

  export interface LogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Log'], meta: { name: 'Log' } }
    /**
     * Find zero or one Log that matches the filter.
     * @param {LogFindUniqueArgs} args - Arguments to find a Log
     * @example
     * // Get one Log
     * const log = await prisma.log.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LogFindUniqueArgs>(args: SelectSubset<T, LogFindUniqueArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Log that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LogFindUniqueOrThrowArgs} args - Arguments to find a Log
     * @example
     * // Get one Log
     * const log = await prisma.log.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LogFindUniqueOrThrowArgs>(args: SelectSubset<T, LogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Log that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogFindFirstArgs} args - Arguments to find a Log
     * @example
     * // Get one Log
     * const log = await prisma.log.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LogFindFirstArgs>(args?: SelectSubset<T, LogFindFirstArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Log that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogFindFirstOrThrowArgs} args - Arguments to find a Log
     * @example
     * // Get one Log
     * const log = await prisma.log.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LogFindFirstOrThrowArgs>(args?: SelectSubset<T, LogFindFirstOrThrowArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Logs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Logs
     * const logs = await prisma.log.findMany()
     * 
     * // Get first 10 Logs
     * const logs = await prisma.log.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const logWithIdOnly = await prisma.log.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LogFindManyArgs>(args?: SelectSubset<T, LogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Log.
     * @param {LogCreateArgs} args - Arguments to create a Log.
     * @example
     * // Create one Log
     * const Log = await prisma.log.create({
     *   data: {
     *     // ... data to create a Log
     *   }
     * })
     * 
     */
    create<T extends LogCreateArgs>(args: SelectSubset<T, LogCreateArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Logs.
     * @param {LogCreateManyArgs} args - Arguments to create many Logs.
     * @example
     * // Create many Logs
     * const log = await prisma.log.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LogCreateManyArgs>(args?: SelectSubset<T, LogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Logs and returns the data saved in the database.
     * @param {LogCreateManyAndReturnArgs} args - Arguments to create many Logs.
     * @example
     * // Create many Logs
     * const log = await prisma.log.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Logs and only return the `id`
     * const logWithIdOnly = await prisma.log.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LogCreateManyAndReturnArgs>(args?: SelectSubset<T, LogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Log.
     * @param {LogDeleteArgs} args - Arguments to delete one Log.
     * @example
     * // Delete one Log
     * const Log = await prisma.log.delete({
     *   where: {
     *     // ... filter to delete one Log
     *   }
     * })
     * 
     */
    delete<T extends LogDeleteArgs>(args: SelectSubset<T, LogDeleteArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Log.
     * @param {LogUpdateArgs} args - Arguments to update one Log.
     * @example
     * // Update one Log
     * const log = await prisma.log.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LogUpdateArgs>(args: SelectSubset<T, LogUpdateArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Logs.
     * @param {LogDeleteManyArgs} args - Arguments to filter Logs to delete.
     * @example
     * // Delete a few Logs
     * const { count } = await prisma.log.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LogDeleteManyArgs>(args?: SelectSubset<T, LogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Logs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Logs
     * const log = await prisma.log.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LogUpdateManyArgs>(args: SelectSubset<T, LogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Logs and returns the data updated in the database.
     * @param {LogUpdateManyAndReturnArgs} args - Arguments to update many Logs.
     * @example
     * // Update many Logs
     * const log = await prisma.log.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Logs and only return the `id`
     * const logWithIdOnly = await prisma.log.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LogUpdateManyAndReturnArgs>(args: SelectSubset<T, LogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Log.
     * @param {LogUpsertArgs} args - Arguments to update or create a Log.
     * @example
     * // Update or create a Log
     * const log = await prisma.log.upsert({
     *   create: {
     *     // ... data to create a Log
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Log we want to update
     *   }
     * })
     */
    upsert<T extends LogUpsertArgs>(args: SelectSubset<T, LogUpsertArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Logs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogCountArgs} args - Arguments to filter Logs to count.
     * @example
     * // Count the number of Logs
     * const count = await prisma.log.count({
     *   where: {
     *     // ... the filter for the Logs we want to count
     *   }
     * })
    **/
    count<T extends LogCountArgs>(
      args?: Subset<T, LogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Log.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LogAggregateArgs>(args: Subset<T, LogAggregateArgs>): Prisma.PrismaPromise<GetLogAggregateType<T>>

    /**
     * Group by Log.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LogGroupByArgs['orderBy'] }
        : { orderBy?: LogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Log model
   */
  readonly fields: LogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Log.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    chatTurns<T extends Log$chatTurnsArgs<ExtArgs> = {}>(args?: Subset<T, Log$chatTurnsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tasks<T extends Log$tasksArgs<ExtArgs> = {}>(args?: Subset<T, Log$tasksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Log model
   */
  interface LogFieldRefs {
    readonly id: FieldRef<"Log", 'String'>
    readonly occurredAt: FieldRef<"Log", 'DateTime'>
    readonly appName: FieldRef<"Log", 'String'>
    readonly appBundleId: FieldRef<"Log", 'String'>
    readonly isSend: FieldRef<"Log", 'Boolean'>
    readonly isWechat: FieldRef<"Log", 'Boolean'>
    readonly screenshotPath: FieldRef<"Log", 'String'>
    readonly createdAt: FieldRef<"Log", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Log findUnique
   */
  export type LogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter, which Log to fetch.
     */
    where: LogWhereUniqueInput
  }

  /**
   * Log findUniqueOrThrow
   */
  export type LogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter, which Log to fetch.
     */
    where: LogWhereUniqueInput
  }

  /**
   * Log findFirst
   */
  export type LogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter, which Log to fetch.
     */
    where?: LogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logs to fetch.
     */
    orderBy?: LogOrderByWithRelationInput | LogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Logs.
     */
    cursor?: LogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Logs.
     */
    distinct?: LogScalarFieldEnum | LogScalarFieldEnum[]
  }

  /**
   * Log findFirstOrThrow
   */
  export type LogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter, which Log to fetch.
     */
    where?: LogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logs to fetch.
     */
    orderBy?: LogOrderByWithRelationInput | LogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Logs.
     */
    cursor?: LogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Logs.
     */
    distinct?: LogScalarFieldEnum | LogScalarFieldEnum[]
  }

  /**
   * Log findMany
   */
  export type LogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter, which Logs to fetch.
     */
    where?: LogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Logs to fetch.
     */
    orderBy?: LogOrderByWithRelationInput | LogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Logs.
     */
    cursor?: LogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Logs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Logs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Logs.
     */
    distinct?: LogScalarFieldEnum | LogScalarFieldEnum[]
  }

  /**
   * Log create
   */
  export type LogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * The data needed to create a Log.
     */
    data: XOR<LogCreateInput, LogUncheckedCreateInput>
  }

  /**
   * Log createMany
   */
  export type LogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Logs.
     */
    data: LogCreateManyInput | LogCreateManyInput[]
  }

  /**
   * Log createManyAndReturn
   */
  export type LogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * The data used to create many Logs.
     */
    data: LogCreateManyInput | LogCreateManyInput[]
  }

  /**
   * Log update
   */
  export type LogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * The data needed to update a Log.
     */
    data: XOR<LogUpdateInput, LogUncheckedUpdateInput>
    /**
     * Choose, which Log to update.
     */
    where: LogWhereUniqueInput
  }

  /**
   * Log updateMany
   */
  export type LogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Logs.
     */
    data: XOR<LogUpdateManyMutationInput, LogUncheckedUpdateManyInput>
    /**
     * Filter which Logs to update
     */
    where?: LogWhereInput
    /**
     * Limit how many Logs to update.
     */
    limit?: number
  }

  /**
   * Log updateManyAndReturn
   */
  export type LogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * The data used to update Logs.
     */
    data: XOR<LogUpdateManyMutationInput, LogUncheckedUpdateManyInput>
    /**
     * Filter which Logs to update
     */
    where?: LogWhereInput
    /**
     * Limit how many Logs to update.
     */
    limit?: number
  }

  /**
   * Log upsert
   */
  export type LogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * The filter to search for the Log to update in case it exists.
     */
    where: LogWhereUniqueInput
    /**
     * In case the Log found by the `where` argument doesn't exist, create a new Log with this data.
     */
    create: XOR<LogCreateInput, LogUncheckedCreateInput>
    /**
     * In case the Log was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LogUpdateInput, LogUncheckedUpdateInput>
  }

  /**
   * Log delete
   */
  export type LogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    /**
     * Filter which Log to delete.
     */
    where: LogWhereUniqueInput
  }

  /**
   * Log deleteMany
   */
  export type LogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Logs to delete
     */
    where?: LogWhereInput
    /**
     * Limit how many Logs to delete.
     */
    limit?: number
  }

  /**
   * Log.chatTurns
   */
  export type Log$chatTurnsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    where?: ChatTurnWhereInput
    orderBy?: ChatTurnOrderByWithRelationInput | ChatTurnOrderByWithRelationInput[]
    cursor?: ChatTurnWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChatTurnScalarFieldEnum | ChatTurnScalarFieldEnum[]
  }

  /**
   * Log.tasks
   */
  export type Log$tasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    where?: TaskWhereInput
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    cursor?: TaskWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Log without action
   */
  export type LogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
  }


  /**
   * Model Person
   */

  export type AggregatePerson = {
    _count: PersonCountAggregateOutputType | null
    _min: PersonMinAggregateOutputType | null
    _max: PersonMaxAggregateOutputType | null
  }

  export type PersonMinAggregateOutputType = {
    id: string | null
    name: string | null
    clientApp: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PersonMaxAggregateOutputType = {
    id: string | null
    name: string | null
    clientApp: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PersonCountAggregateOutputType = {
    id: number
    name: number
    clientApp: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PersonMinAggregateInputType = {
    id?: true
    name?: true
    clientApp?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PersonMaxAggregateInputType = {
    id?: true
    name?: true
    clientApp?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PersonCountAggregateInputType = {
    id?: true
    name?: true
    clientApp?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PersonAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Person to aggregate.
     */
    where?: PersonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of People to fetch.
     */
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PersonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` People from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` People.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned People
    **/
    _count?: true | PersonCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PersonMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PersonMaxAggregateInputType
  }

  export type GetPersonAggregateType<T extends PersonAggregateArgs> = {
        [P in keyof T & keyof AggregatePerson]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePerson[P]>
      : GetScalarType<T[P], AggregatePerson[P]>
  }




  export type PersonGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PersonWhereInput
    orderBy?: PersonOrderByWithAggregationInput | PersonOrderByWithAggregationInput[]
    by: PersonScalarFieldEnum[] | PersonScalarFieldEnum
    having?: PersonScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PersonCountAggregateInputType | true
    _min?: PersonMinAggregateInputType
    _max?: PersonMaxAggregateInputType
  }

  export type PersonGroupByOutputType = {
    id: string
    name: string
    clientApp: string
    createdAt: Date
    updatedAt: Date
    _count: PersonCountAggregateOutputType | null
    _min: PersonMinAggregateOutputType | null
    _max: PersonMaxAggregateOutputType | null
  }

  type GetPersonGroupByPayload<T extends PersonGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PersonGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PersonGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PersonGroupByOutputType[P]>
            : GetScalarType<T[P], PersonGroupByOutputType[P]>
        }
      >
    >


  export type PersonSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    clientApp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    chatTurns?: boolean | Person$chatTurnsArgs<ExtArgs>
    tasks?: boolean | Person$tasksArgs<ExtArgs>
    _count?: boolean | PersonCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["person"]>

  export type PersonSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    clientApp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["person"]>

  export type PersonSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    clientApp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["person"]>

  export type PersonSelectScalar = {
    id?: boolean
    name?: boolean
    clientApp?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PersonOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "clientApp" | "createdAt" | "updatedAt", ExtArgs["result"]["person"]>
  export type PersonInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    chatTurns?: boolean | Person$chatTurnsArgs<ExtArgs>
    tasks?: boolean | Person$tasksArgs<ExtArgs>
    _count?: boolean | PersonCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PersonIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type PersonIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PersonPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Person"
    objects: {
      chatTurns: Prisma.$ChatTurnPayload<ExtArgs>[]
      tasks: Prisma.$TaskPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      clientApp: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["person"]>
    composites: {}
  }

  type PersonGetPayload<S extends boolean | null | undefined | PersonDefaultArgs> = $Result.GetResult<Prisma.$PersonPayload, S>

  type PersonCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PersonFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PersonCountAggregateInputType | true
    }

  export interface PersonDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Person'], meta: { name: 'Person' } }
    /**
     * Find zero or one Person that matches the filter.
     * @param {PersonFindUniqueArgs} args - Arguments to find a Person
     * @example
     * // Get one Person
     * const person = await prisma.person.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PersonFindUniqueArgs>(args: SelectSubset<T, PersonFindUniqueArgs<ExtArgs>>): Prisma__PersonClient<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Person that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PersonFindUniqueOrThrowArgs} args - Arguments to find a Person
     * @example
     * // Get one Person
     * const person = await prisma.person.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PersonFindUniqueOrThrowArgs>(args: SelectSubset<T, PersonFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PersonClient<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Person that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonFindFirstArgs} args - Arguments to find a Person
     * @example
     * // Get one Person
     * const person = await prisma.person.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PersonFindFirstArgs>(args?: SelectSubset<T, PersonFindFirstArgs<ExtArgs>>): Prisma__PersonClient<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Person that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonFindFirstOrThrowArgs} args - Arguments to find a Person
     * @example
     * // Get one Person
     * const person = await prisma.person.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PersonFindFirstOrThrowArgs>(args?: SelectSubset<T, PersonFindFirstOrThrowArgs<ExtArgs>>): Prisma__PersonClient<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more People that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all People
     * const people = await prisma.person.findMany()
     * 
     * // Get first 10 People
     * const people = await prisma.person.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const personWithIdOnly = await prisma.person.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PersonFindManyArgs>(args?: SelectSubset<T, PersonFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Person.
     * @param {PersonCreateArgs} args - Arguments to create a Person.
     * @example
     * // Create one Person
     * const Person = await prisma.person.create({
     *   data: {
     *     // ... data to create a Person
     *   }
     * })
     * 
     */
    create<T extends PersonCreateArgs>(args: SelectSubset<T, PersonCreateArgs<ExtArgs>>): Prisma__PersonClient<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many People.
     * @param {PersonCreateManyArgs} args - Arguments to create many People.
     * @example
     * // Create many People
     * const person = await prisma.person.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PersonCreateManyArgs>(args?: SelectSubset<T, PersonCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many People and returns the data saved in the database.
     * @param {PersonCreateManyAndReturnArgs} args - Arguments to create many People.
     * @example
     * // Create many People
     * const person = await prisma.person.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many People and only return the `id`
     * const personWithIdOnly = await prisma.person.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PersonCreateManyAndReturnArgs>(args?: SelectSubset<T, PersonCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Person.
     * @param {PersonDeleteArgs} args - Arguments to delete one Person.
     * @example
     * // Delete one Person
     * const Person = await prisma.person.delete({
     *   where: {
     *     // ... filter to delete one Person
     *   }
     * })
     * 
     */
    delete<T extends PersonDeleteArgs>(args: SelectSubset<T, PersonDeleteArgs<ExtArgs>>): Prisma__PersonClient<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Person.
     * @param {PersonUpdateArgs} args - Arguments to update one Person.
     * @example
     * // Update one Person
     * const person = await prisma.person.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PersonUpdateArgs>(args: SelectSubset<T, PersonUpdateArgs<ExtArgs>>): Prisma__PersonClient<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more People.
     * @param {PersonDeleteManyArgs} args - Arguments to filter People to delete.
     * @example
     * // Delete a few People
     * const { count } = await prisma.person.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PersonDeleteManyArgs>(args?: SelectSubset<T, PersonDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more People.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many People
     * const person = await prisma.person.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PersonUpdateManyArgs>(args: SelectSubset<T, PersonUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more People and returns the data updated in the database.
     * @param {PersonUpdateManyAndReturnArgs} args - Arguments to update many People.
     * @example
     * // Update many People
     * const person = await prisma.person.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more People and only return the `id`
     * const personWithIdOnly = await prisma.person.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PersonUpdateManyAndReturnArgs>(args: SelectSubset<T, PersonUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Person.
     * @param {PersonUpsertArgs} args - Arguments to update or create a Person.
     * @example
     * // Update or create a Person
     * const person = await prisma.person.upsert({
     *   create: {
     *     // ... data to create a Person
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Person we want to update
     *   }
     * })
     */
    upsert<T extends PersonUpsertArgs>(args: SelectSubset<T, PersonUpsertArgs<ExtArgs>>): Prisma__PersonClient<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of People.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonCountArgs} args - Arguments to filter People to count.
     * @example
     * // Count the number of People
     * const count = await prisma.person.count({
     *   where: {
     *     // ... the filter for the People we want to count
     *   }
     * })
    **/
    count<T extends PersonCountArgs>(
      args?: Subset<T, PersonCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PersonCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Person.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PersonAggregateArgs>(args: Subset<T, PersonAggregateArgs>): Prisma.PrismaPromise<GetPersonAggregateType<T>>

    /**
     * Group by Person.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PersonGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PersonGroupByArgs['orderBy'] }
        : { orderBy?: PersonGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PersonGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPersonGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Person model
   */
  readonly fields: PersonFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Person.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PersonClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    chatTurns<T extends Person$chatTurnsArgs<ExtArgs> = {}>(args?: Subset<T, Person$chatTurnsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tasks<T extends Person$tasksArgs<ExtArgs> = {}>(args?: Subset<T, Person$tasksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Person model
   */
  interface PersonFieldRefs {
    readonly id: FieldRef<"Person", 'String'>
    readonly name: FieldRef<"Person", 'String'>
    readonly clientApp: FieldRef<"Person", 'String'>
    readonly createdAt: FieldRef<"Person", 'DateTime'>
    readonly updatedAt: FieldRef<"Person", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Person findUnique
   */
  export type PersonFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
    /**
     * Filter, which Person to fetch.
     */
    where: PersonWhereUniqueInput
  }

  /**
   * Person findUniqueOrThrow
   */
  export type PersonFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
    /**
     * Filter, which Person to fetch.
     */
    where: PersonWhereUniqueInput
  }

  /**
   * Person findFirst
   */
  export type PersonFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
    /**
     * Filter, which Person to fetch.
     */
    where?: PersonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of People to fetch.
     */
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for People.
     */
    cursor?: PersonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` People from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` People.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of People.
     */
    distinct?: PersonScalarFieldEnum | PersonScalarFieldEnum[]
  }

  /**
   * Person findFirstOrThrow
   */
  export type PersonFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
    /**
     * Filter, which Person to fetch.
     */
    where?: PersonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of People to fetch.
     */
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for People.
     */
    cursor?: PersonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` People from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` People.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of People.
     */
    distinct?: PersonScalarFieldEnum | PersonScalarFieldEnum[]
  }

  /**
   * Person findMany
   */
  export type PersonFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
    /**
     * Filter, which People to fetch.
     */
    where?: PersonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of People to fetch.
     */
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing People.
     */
    cursor?: PersonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` People from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` People.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of People.
     */
    distinct?: PersonScalarFieldEnum | PersonScalarFieldEnum[]
  }

  /**
   * Person create
   */
  export type PersonCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
    /**
     * The data needed to create a Person.
     */
    data: XOR<PersonCreateInput, PersonUncheckedCreateInput>
  }

  /**
   * Person createMany
   */
  export type PersonCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many People.
     */
    data: PersonCreateManyInput | PersonCreateManyInput[]
  }

  /**
   * Person createManyAndReturn
   */
  export type PersonCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * The data used to create many People.
     */
    data: PersonCreateManyInput | PersonCreateManyInput[]
  }

  /**
   * Person update
   */
  export type PersonUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
    /**
     * The data needed to update a Person.
     */
    data: XOR<PersonUpdateInput, PersonUncheckedUpdateInput>
    /**
     * Choose, which Person to update.
     */
    where: PersonWhereUniqueInput
  }

  /**
   * Person updateMany
   */
  export type PersonUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update People.
     */
    data: XOR<PersonUpdateManyMutationInput, PersonUncheckedUpdateManyInput>
    /**
     * Filter which People to update
     */
    where?: PersonWhereInput
    /**
     * Limit how many People to update.
     */
    limit?: number
  }

  /**
   * Person updateManyAndReturn
   */
  export type PersonUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * The data used to update People.
     */
    data: XOR<PersonUpdateManyMutationInput, PersonUncheckedUpdateManyInput>
    /**
     * Filter which People to update
     */
    where?: PersonWhereInput
    /**
     * Limit how many People to update.
     */
    limit?: number
  }

  /**
   * Person upsert
   */
  export type PersonUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
    /**
     * The filter to search for the Person to update in case it exists.
     */
    where: PersonWhereUniqueInput
    /**
     * In case the Person found by the `where` argument doesn't exist, create a new Person with this data.
     */
    create: XOR<PersonCreateInput, PersonUncheckedCreateInput>
    /**
     * In case the Person was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PersonUpdateInput, PersonUncheckedUpdateInput>
  }

  /**
   * Person delete
   */
  export type PersonDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
    /**
     * Filter which Person to delete.
     */
    where: PersonWhereUniqueInput
  }

  /**
   * Person deleteMany
   */
  export type PersonDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which People to delete
     */
    where?: PersonWhereInput
    /**
     * Limit how many People to delete.
     */
    limit?: number
  }

  /**
   * Person.chatTurns
   */
  export type Person$chatTurnsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    where?: ChatTurnWhereInput
    orderBy?: ChatTurnOrderByWithRelationInput | ChatTurnOrderByWithRelationInput[]
    cursor?: ChatTurnWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChatTurnScalarFieldEnum | ChatTurnScalarFieldEnum[]
  }

  /**
   * Person.tasks
   */
  export type Person$tasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    where?: TaskWhereInput
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    cursor?: TaskWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Person without action
   */
  export type PersonDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
  }


  /**
   * Model ChatTurn
   */

  export type AggregateChatTurn = {
    _count: ChatTurnCountAggregateOutputType | null
    _min: ChatTurnMinAggregateOutputType | null
    _max: ChatTurnMaxAggregateOutputType | null
  }

  export type ChatTurnMinAggregateOutputType = {
    id: string | null
    logId: string | null
    personId: string | null
    topic: string | null
    capturedAt: Date | null
    createdAt: Date | null
  }

  export type ChatTurnMaxAggregateOutputType = {
    id: string | null
    logId: string | null
    personId: string | null
    topic: string | null
    capturedAt: Date | null
    createdAt: Date | null
  }

  export type ChatTurnCountAggregateOutputType = {
    id: number
    logId: number
    personId: number
    topic: number
    capturedAt: number
    rawAiResponse: number
    createdAt: number
    _all: number
  }


  export type ChatTurnMinAggregateInputType = {
    id?: true
    logId?: true
    personId?: true
    topic?: true
    capturedAt?: true
    createdAt?: true
  }

  export type ChatTurnMaxAggregateInputType = {
    id?: true
    logId?: true
    personId?: true
    topic?: true
    capturedAt?: true
    createdAt?: true
  }

  export type ChatTurnCountAggregateInputType = {
    id?: true
    logId?: true
    personId?: true
    topic?: true
    capturedAt?: true
    rawAiResponse?: true
    createdAt?: true
    _all?: true
  }

  export type ChatTurnAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChatTurn to aggregate.
     */
    where?: ChatTurnWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatTurns to fetch.
     */
    orderBy?: ChatTurnOrderByWithRelationInput | ChatTurnOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChatTurnWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatTurns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatTurns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ChatTurns
    **/
    _count?: true | ChatTurnCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChatTurnMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChatTurnMaxAggregateInputType
  }

  export type GetChatTurnAggregateType<T extends ChatTurnAggregateArgs> = {
        [P in keyof T & keyof AggregateChatTurn]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChatTurn[P]>
      : GetScalarType<T[P], AggregateChatTurn[P]>
  }




  export type ChatTurnGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChatTurnWhereInput
    orderBy?: ChatTurnOrderByWithAggregationInput | ChatTurnOrderByWithAggregationInput[]
    by: ChatTurnScalarFieldEnum[] | ChatTurnScalarFieldEnum
    having?: ChatTurnScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChatTurnCountAggregateInputType | true
    _min?: ChatTurnMinAggregateInputType
    _max?: ChatTurnMaxAggregateInputType
  }

  export type ChatTurnGroupByOutputType = {
    id: string
    logId: string
    personId: string
    topic: string
    capturedAt: Date
    rawAiResponse: JsonValue | null
    createdAt: Date
    _count: ChatTurnCountAggregateOutputType | null
    _min: ChatTurnMinAggregateOutputType | null
    _max: ChatTurnMaxAggregateOutputType | null
  }

  type GetChatTurnGroupByPayload<T extends ChatTurnGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChatTurnGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChatTurnGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChatTurnGroupByOutputType[P]>
            : GetScalarType<T[P], ChatTurnGroupByOutputType[P]>
        }
      >
    >


  export type ChatTurnSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    logId?: boolean
    personId?: boolean
    topic?: boolean
    capturedAt?: boolean
    rawAiResponse?: boolean
    createdAt?: boolean
    log?: boolean | LogDefaultArgs<ExtArgs>
    person?: boolean | PersonDefaultArgs<ExtArgs>
    messages?: boolean | ChatTurn$messagesArgs<ExtArgs>
    tasks?: boolean | ChatTurn$tasksArgs<ExtArgs>
    _count?: boolean | ChatTurnCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatTurn"]>

  export type ChatTurnSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    logId?: boolean
    personId?: boolean
    topic?: boolean
    capturedAt?: boolean
    rawAiResponse?: boolean
    createdAt?: boolean
    log?: boolean | LogDefaultArgs<ExtArgs>
    person?: boolean | PersonDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatTurn"]>

  export type ChatTurnSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    logId?: boolean
    personId?: boolean
    topic?: boolean
    capturedAt?: boolean
    rawAiResponse?: boolean
    createdAt?: boolean
    log?: boolean | LogDefaultArgs<ExtArgs>
    person?: boolean | PersonDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatTurn"]>

  export type ChatTurnSelectScalar = {
    id?: boolean
    logId?: boolean
    personId?: boolean
    topic?: boolean
    capturedAt?: boolean
    rawAiResponse?: boolean
    createdAt?: boolean
  }

  export type ChatTurnOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "logId" | "personId" | "topic" | "capturedAt" | "rawAiResponse" | "createdAt", ExtArgs["result"]["chatTurn"]>
  export type ChatTurnInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    log?: boolean | LogDefaultArgs<ExtArgs>
    person?: boolean | PersonDefaultArgs<ExtArgs>
    messages?: boolean | ChatTurn$messagesArgs<ExtArgs>
    tasks?: boolean | ChatTurn$tasksArgs<ExtArgs>
    _count?: boolean | ChatTurnCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ChatTurnIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    log?: boolean | LogDefaultArgs<ExtArgs>
    person?: boolean | PersonDefaultArgs<ExtArgs>
  }
  export type ChatTurnIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    log?: boolean | LogDefaultArgs<ExtArgs>
    person?: boolean | PersonDefaultArgs<ExtArgs>
  }

  export type $ChatTurnPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ChatTurn"
    objects: {
      log: Prisma.$LogPayload<ExtArgs>
      person: Prisma.$PersonPayload<ExtArgs>
      messages: Prisma.$ChatMessagePayload<ExtArgs>[]
      tasks: Prisma.$TaskPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      logId: string
      personId: string
      topic: string
      capturedAt: Date
      rawAiResponse: Prisma.JsonValue | null
      createdAt: Date
    }, ExtArgs["result"]["chatTurn"]>
    composites: {}
  }

  type ChatTurnGetPayload<S extends boolean | null | undefined | ChatTurnDefaultArgs> = $Result.GetResult<Prisma.$ChatTurnPayload, S>

  type ChatTurnCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ChatTurnFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ChatTurnCountAggregateInputType | true
    }

  export interface ChatTurnDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ChatTurn'], meta: { name: 'ChatTurn' } }
    /**
     * Find zero or one ChatTurn that matches the filter.
     * @param {ChatTurnFindUniqueArgs} args - Arguments to find a ChatTurn
     * @example
     * // Get one ChatTurn
     * const chatTurn = await prisma.chatTurn.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChatTurnFindUniqueArgs>(args: SelectSubset<T, ChatTurnFindUniqueArgs<ExtArgs>>): Prisma__ChatTurnClient<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ChatTurn that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ChatTurnFindUniqueOrThrowArgs} args - Arguments to find a ChatTurn
     * @example
     * // Get one ChatTurn
     * const chatTurn = await prisma.chatTurn.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChatTurnFindUniqueOrThrowArgs>(args: SelectSubset<T, ChatTurnFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChatTurnClient<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChatTurn that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatTurnFindFirstArgs} args - Arguments to find a ChatTurn
     * @example
     * // Get one ChatTurn
     * const chatTurn = await prisma.chatTurn.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChatTurnFindFirstArgs>(args?: SelectSubset<T, ChatTurnFindFirstArgs<ExtArgs>>): Prisma__ChatTurnClient<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChatTurn that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatTurnFindFirstOrThrowArgs} args - Arguments to find a ChatTurn
     * @example
     * // Get one ChatTurn
     * const chatTurn = await prisma.chatTurn.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChatTurnFindFirstOrThrowArgs>(args?: SelectSubset<T, ChatTurnFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChatTurnClient<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ChatTurns that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatTurnFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ChatTurns
     * const chatTurns = await prisma.chatTurn.findMany()
     * 
     * // Get first 10 ChatTurns
     * const chatTurns = await prisma.chatTurn.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chatTurnWithIdOnly = await prisma.chatTurn.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChatTurnFindManyArgs>(args?: SelectSubset<T, ChatTurnFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ChatTurn.
     * @param {ChatTurnCreateArgs} args - Arguments to create a ChatTurn.
     * @example
     * // Create one ChatTurn
     * const ChatTurn = await prisma.chatTurn.create({
     *   data: {
     *     // ... data to create a ChatTurn
     *   }
     * })
     * 
     */
    create<T extends ChatTurnCreateArgs>(args: SelectSubset<T, ChatTurnCreateArgs<ExtArgs>>): Prisma__ChatTurnClient<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ChatTurns.
     * @param {ChatTurnCreateManyArgs} args - Arguments to create many ChatTurns.
     * @example
     * // Create many ChatTurns
     * const chatTurn = await prisma.chatTurn.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChatTurnCreateManyArgs>(args?: SelectSubset<T, ChatTurnCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ChatTurns and returns the data saved in the database.
     * @param {ChatTurnCreateManyAndReturnArgs} args - Arguments to create many ChatTurns.
     * @example
     * // Create many ChatTurns
     * const chatTurn = await prisma.chatTurn.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ChatTurns and only return the `id`
     * const chatTurnWithIdOnly = await prisma.chatTurn.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChatTurnCreateManyAndReturnArgs>(args?: SelectSubset<T, ChatTurnCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ChatTurn.
     * @param {ChatTurnDeleteArgs} args - Arguments to delete one ChatTurn.
     * @example
     * // Delete one ChatTurn
     * const ChatTurn = await prisma.chatTurn.delete({
     *   where: {
     *     // ... filter to delete one ChatTurn
     *   }
     * })
     * 
     */
    delete<T extends ChatTurnDeleteArgs>(args: SelectSubset<T, ChatTurnDeleteArgs<ExtArgs>>): Prisma__ChatTurnClient<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ChatTurn.
     * @param {ChatTurnUpdateArgs} args - Arguments to update one ChatTurn.
     * @example
     * // Update one ChatTurn
     * const chatTurn = await prisma.chatTurn.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChatTurnUpdateArgs>(args: SelectSubset<T, ChatTurnUpdateArgs<ExtArgs>>): Prisma__ChatTurnClient<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ChatTurns.
     * @param {ChatTurnDeleteManyArgs} args - Arguments to filter ChatTurns to delete.
     * @example
     * // Delete a few ChatTurns
     * const { count } = await prisma.chatTurn.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChatTurnDeleteManyArgs>(args?: SelectSubset<T, ChatTurnDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChatTurns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatTurnUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ChatTurns
     * const chatTurn = await prisma.chatTurn.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChatTurnUpdateManyArgs>(args: SelectSubset<T, ChatTurnUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChatTurns and returns the data updated in the database.
     * @param {ChatTurnUpdateManyAndReturnArgs} args - Arguments to update many ChatTurns.
     * @example
     * // Update many ChatTurns
     * const chatTurn = await prisma.chatTurn.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ChatTurns and only return the `id`
     * const chatTurnWithIdOnly = await prisma.chatTurn.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ChatTurnUpdateManyAndReturnArgs>(args: SelectSubset<T, ChatTurnUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ChatTurn.
     * @param {ChatTurnUpsertArgs} args - Arguments to update or create a ChatTurn.
     * @example
     * // Update or create a ChatTurn
     * const chatTurn = await prisma.chatTurn.upsert({
     *   create: {
     *     // ... data to create a ChatTurn
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ChatTurn we want to update
     *   }
     * })
     */
    upsert<T extends ChatTurnUpsertArgs>(args: SelectSubset<T, ChatTurnUpsertArgs<ExtArgs>>): Prisma__ChatTurnClient<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ChatTurns.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatTurnCountArgs} args - Arguments to filter ChatTurns to count.
     * @example
     * // Count the number of ChatTurns
     * const count = await prisma.chatTurn.count({
     *   where: {
     *     // ... the filter for the ChatTurns we want to count
     *   }
     * })
    **/
    count<T extends ChatTurnCountArgs>(
      args?: Subset<T, ChatTurnCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChatTurnCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ChatTurn.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatTurnAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChatTurnAggregateArgs>(args: Subset<T, ChatTurnAggregateArgs>): Prisma.PrismaPromise<GetChatTurnAggregateType<T>>

    /**
     * Group by ChatTurn.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatTurnGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChatTurnGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChatTurnGroupByArgs['orderBy'] }
        : { orderBy?: ChatTurnGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChatTurnGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChatTurnGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ChatTurn model
   */
  readonly fields: ChatTurnFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ChatTurn.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChatTurnClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    log<T extends LogDefaultArgs<ExtArgs> = {}>(args?: Subset<T, LogDefaultArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    person<T extends PersonDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PersonDefaultArgs<ExtArgs>>): Prisma__PersonClient<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    messages<T extends ChatTurn$messagesArgs<ExtArgs> = {}>(args?: Subset<T, ChatTurn$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    tasks<T extends ChatTurn$tasksArgs<ExtArgs> = {}>(args?: Subset<T, ChatTurn$tasksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ChatTurn model
   */
  interface ChatTurnFieldRefs {
    readonly id: FieldRef<"ChatTurn", 'String'>
    readonly logId: FieldRef<"ChatTurn", 'String'>
    readonly personId: FieldRef<"ChatTurn", 'String'>
    readonly topic: FieldRef<"ChatTurn", 'String'>
    readonly capturedAt: FieldRef<"ChatTurn", 'DateTime'>
    readonly rawAiResponse: FieldRef<"ChatTurn", 'Json'>
    readonly createdAt: FieldRef<"ChatTurn", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ChatTurn findUnique
   */
  export type ChatTurnFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    /**
     * Filter, which ChatTurn to fetch.
     */
    where: ChatTurnWhereUniqueInput
  }

  /**
   * ChatTurn findUniqueOrThrow
   */
  export type ChatTurnFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    /**
     * Filter, which ChatTurn to fetch.
     */
    where: ChatTurnWhereUniqueInput
  }

  /**
   * ChatTurn findFirst
   */
  export type ChatTurnFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    /**
     * Filter, which ChatTurn to fetch.
     */
    where?: ChatTurnWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatTurns to fetch.
     */
    orderBy?: ChatTurnOrderByWithRelationInput | ChatTurnOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChatTurns.
     */
    cursor?: ChatTurnWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatTurns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatTurns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatTurns.
     */
    distinct?: ChatTurnScalarFieldEnum | ChatTurnScalarFieldEnum[]
  }

  /**
   * ChatTurn findFirstOrThrow
   */
  export type ChatTurnFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    /**
     * Filter, which ChatTurn to fetch.
     */
    where?: ChatTurnWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatTurns to fetch.
     */
    orderBy?: ChatTurnOrderByWithRelationInput | ChatTurnOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChatTurns.
     */
    cursor?: ChatTurnWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatTurns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatTurns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatTurns.
     */
    distinct?: ChatTurnScalarFieldEnum | ChatTurnScalarFieldEnum[]
  }

  /**
   * ChatTurn findMany
   */
  export type ChatTurnFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    /**
     * Filter, which ChatTurns to fetch.
     */
    where?: ChatTurnWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatTurns to fetch.
     */
    orderBy?: ChatTurnOrderByWithRelationInput | ChatTurnOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ChatTurns.
     */
    cursor?: ChatTurnWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatTurns from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatTurns.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatTurns.
     */
    distinct?: ChatTurnScalarFieldEnum | ChatTurnScalarFieldEnum[]
  }

  /**
   * ChatTurn create
   */
  export type ChatTurnCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    /**
     * The data needed to create a ChatTurn.
     */
    data: XOR<ChatTurnCreateInput, ChatTurnUncheckedCreateInput>
  }

  /**
   * ChatTurn createMany
   */
  export type ChatTurnCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ChatTurns.
     */
    data: ChatTurnCreateManyInput | ChatTurnCreateManyInput[]
  }

  /**
   * ChatTurn createManyAndReturn
   */
  export type ChatTurnCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * The data used to create many ChatTurns.
     */
    data: ChatTurnCreateManyInput | ChatTurnCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChatTurn update
   */
  export type ChatTurnUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    /**
     * The data needed to update a ChatTurn.
     */
    data: XOR<ChatTurnUpdateInput, ChatTurnUncheckedUpdateInput>
    /**
     * Choose, which ChatTurn to update.
     */
    where: ChatTurnWhereUniqueInput
  }

  /**
   * ChatTurn updateMany
   */
  export type ChatTurnUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ChatTurns.
     */
    data: XOR<ChatTurnUpdateManyMutationInput, ChatTurnUncheckedUpdateManyInput>
    /**
     * Filter which ChatTurns to update
     */
    where?: ChatTurnWhereInput
    /**
     * Limit how many ChatTurns to update.
     */
    limit?: number
  }

  /**
   * ChatTurn updateManyAndReturn
   */
  export type ChatTurnUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * The data used to update ChatTurns.
     */
    data: XOR<ChatTurnUpdateManyMutationInput, ChatTurnUncheckedUpdateManyInput>
    /**
     * Filter which ChatTurns to update
     */
    where?: ChatTurnWhereInput
    /**
     * Limit how many ChatTurns to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChatTurn upsert
   */
  export type ChatTurnUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    /**
     * The filter to search for the ChatTurn to update in case it exists.
     */
    where: ChatTurnWhereUniqueInput
    /**
     * In case the ChatTurn found by the `where` argument doesn't exist, create a new ChatTurn with this data.
     */
    create: XOR<ChatTurnCreateInput, ChatTurnUncheckedCreateInput>
    /**
     * In case the ChatTurn was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChatTurnUpdateInput, ChatTurnUncheckedUpdateInput>
  }

  /**
   * ChatTurn delete
   */
  export type ChatTurnDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    /**
     * Filter which ChatTurn to delete.
     */
    where: ChatTurnWhereUniqueInput
  }

  /**
   * ChatTurn deleteMany
   */
  export type ChatTurnDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChatTurns to delete
     */
    where?: ChatTurnWhereInput
    /**
     * Limit how many ChatTurns to delete.
     */
    limit?: number
  }

  /**
   * ChatTurn.messages
   */
  export type ChatTurn$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    where?: ChatMessageWhereInput
    orderBy?: ChatMessageOrderByWithRelationInput | ChatMessageOrderByWithRelationInput[]
    cursor?: ChatMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ChatMessageScalarFieldEnum | ChatMessageScalarFieldEnum[]
  }

  /**
   * ChatTurn.tasks
   */
  export type ChatTurn$tasksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    where?: TaskWhereInput
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    cursor?: TaskWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * ChatTurn without action
   */
  export type ChatTurnDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
  }


  /**
   * Model ChatMessage
   */

  export type AggregateChatMessage = {
    _count: ChatMessageCountAggregateOutputType | null
    _avg: ChatMessageAvgAggregateOutputType | null
    _sum: ChatMessageSumAggregateOutputType | null
    _min: ChatMessageMinAggregateOutputType | null
    _max: ChatMessageMaxAggregateOutputType | null
  }

  export type ChatMessageAvgAggregateOutputType = {
    seq: number | null
  }

  export type ChatMessageSumAggregateOutputType = {
    seq: number | null
  }

  export type ChatMessageMinAggregateOutputType = {
    id: string | null
    turnId: string | null
    role: string | null
    senderName: string | null
    senderNormalized: string | null
    content: string | null
    contentType: string | null
    quoteText: string | null
    quoteSenderName: string | null
    quoteRole: string | null
    quoteContentType: string | null
    isQuoted: boolean | null
    isRevoked: boolean | null
    messageKey: string | null
    seq: number | null
    createdAt: Date | null
  }

  export type ChatMessageMaxAggregateOutputType = {
    id: string | null
    turnId: string | null
    role: string | null
    senderName: string | null
    senderNormalized: string | null
    content: string | null
    contentType: string | null
    quoteText: string | null
    quoteSenderName: string | null
    quoteRole: string | null
    quoteContentType: string | null
    isQuoted: boolean | null
    isRevoked: boolean | null
    messageKey: string | null
    seq: number | null
    createdAt: Date | null
  }

  export type ChatMessageCountAggregateOutputType = {
    id: number
    turnId: number
    role: number
    senderName: number
    senderNormalized: number
    content: number
    contentType: number
    quoteText: number
    quoteSenderName: number
    quoteRole: number
    quoteContentType: number
    isQuoted: number
    isRevoked: number
    messageKey: number
    rawExtracted: number
    seq: number
    createdAt: number
    _all: number
  }


  export type ChatMessageAvgAggregateInputType = {
    seq?: true
  }

  export type ChatMessageSumAggregateInputType = {
    seq?: true
  }

  export type ChatMessageMinAggregateInputType = {
    id?: true
    turnId?: true
    role?: true
    senderName?: true
    senderNormalized?: true
    content?: true
    contentType?: true
    quoteText?: true
    quoteSenderName?: true
    quoteRole?: true
    quoteContentType?: true
    isQuoted?: true
    isRevoked?: true
    messageKey?: true
    seq?: true
    createdAt?: true
  }

  export type ChatMessageMaxAggregateInputType = {
    id?: true
    turnId?: true
    role?: true
    senderName?: true
    senderNormalized?: true
    content?: true
    contentType?: true
    quoteText?: true
    quoteSenderName?: true
    quoteRole?: true
    quoteContentType?: true
    isQuoted?: true
    isRevoked?: true
    messageKey?: true
    seq?: true
    createdAt?: true
  }

  export type ChatMessageCountAggregateInputType = {
    id?: true
    turnId?: true
    role?: true
    senderName?: true
    senderNormalized?: true
    content?: true
    contentType?: true
    quoteText?: true
    quoteSenderName?: true
    quoteRole?: true
    quoteContentType?: true
    isQuoted?: true
    isRevoked?: true
    messageKey?: true
    rawExtracted?: true
    seq?: true
    createdAt?: true
    _all?: true
  }

  export type ChatMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChatMessage to aggregate.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: ChatMessageOrderByWithRelationInput | ChatMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ChatMessages
    **/
    _count?: true | ChatMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ChatMessageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ChatMessageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ChatMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ChatMessageMaxAggregateInputType
  }

  export type GetChatMessageAggregateType<T extends ChatMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateChatMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateChatMessage[P]>
      : GetScalarType<T[P], AggregateChatMessage[P]>
  }




  export type ChatMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ChatMessageWhereInput
    orderBy?: ChatMessageOrderByWithAggregationInput | ChatMessageOrderByWithAggregationInput[]
    by: ChatMessageScalarFieldEnum[] | ChatMessageScalarFieldEnum
    having?: ChatMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ChatMessageCountAggregateInputType | true
    _avg?: ChatMessageAvgAggregateInputType
    _sum?: ChatMessageSumAggregateInputType
    _min?: ChatMessageMinAggregateInputType
    _max?: ChatMessageMaxAggregateInputType
  }

  export type ChatMessageGroupByOutputType = {
    id: string
    turnId: string
    role: string
    senderName: string | null
    senderNormalized: string | null
    content: string
    contentType: string
    quoteText: string | null
    quoteSenderName: string | null
    quoteRole: string | null
    quoteContentType: string | null
    isQuoted: boolean
    isRevoked: boolean
    messageKey: string
    rawExtracted: JsonValue | null
    seq: number
    createdAt: Date
    _count: ChatMessageCountAggregateOutputType | null
    _avg: ChatMessageAvgAggregateOutputType | null
    _sum: ChatMessageSumAggregateOutputType | null
    _min: ChatMessageMinAggregateOutputType | null
    _max: ChatMessageMaxAggregateOutputType | null
  }

  type GetChatMessageGroupByPayload<T extends ChatMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ChatMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ChatMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ChatMessageGroupByOutputType[P]>
            : GetScalarType<T[P], ChatMessageGroupByOutputType[P]>
        }
      >
    >


  export type ChatMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    turnId?: boolean
    role?: boolean
    senderName?: boolean
    senderNormalized?: boolean
    content?: boolean
    contentType?: boolean
    quoteText?: boolean
    quoteSenderName?: boolean
    quoteRole?: boolean
    quoteContentType?: boolean
    isQuoted?: boolean
    isRevoked?: boolean
    messageKey?: boolean
    rawExtracted?: boolean
    seq?: boolean
    createdAt?: boolean
    turn?: boolean | ChatTurnDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatMessage"]>

  export type ChatMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    turnId?: boolean
    role?: boolean
    senderName?: boolean
    senderNormalized?: boolean
    content?: boolean
    contentType?: boolean
    quoteText?: boolean
    quoteSenderName?: boolean
    quoteRole?: boolean
    quoteContentType?: boolean
    isQuoted?: boolean
    isRevoked?: boolean
    messageKey?: boolean
    rawExtracted?: boolean
    seq?: boolean
    createdAt?: boolean
    turn?: boolean | ChatTurnDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatMessage"]>

  export type ChatMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    turnId?: boolean
    role?: boolean
    senderName?: boolean
    senderNormalized?: boolean
    content?: boolean
    contentType?: boolean
    quoteText?: boolean
    quoteSenderName?: boolean
    quoteRole?: boolean
    quoteContentType?: boolean
    isQuoted?: boolean
    isRevoked?: boolean
    messageKey?: boolean
    rawExtracted?: boolean
    seq?: boolean
    createdAt?: boolean
    turn?: boolean | ChatTurnDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["chatMessage"]>

  export type ChatMessageSelectScalar = {
    id?: boolean
    turnId?: boolean
    role?: boolean
    senderName?: boolean
    senderNormalized?: boolean
    content?: boolean
    contentType?: boolean
    quoteText?: boolean
    quoteSenderName?: boolean
    quoteRole?: boolean
    quoteContentType?: boolean
    isQuoted?: boolean
    isRevoked?: boolean
    messageKey?: boolean
    rawExtracted?: boolean
    seq?: boolean
    createdAt?: boolean
  }

  export type ChatMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "turnId" | "role" | "senderName" | "senderNormalized" | "content" | "contentType" | "quoteText" | "quoteSenderName" | "quoteRole" | "quoteContentType" | "isQuoted" | "isRevoked" | "messageKey" | "rawExtracted" | "seq" | "createdAt", ExtArgs["result"]["chatMessage"]>
  export type ChatMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    turn?: boolean | ChatTurnDefaultArgs<ExtArgs>
  }
  export type ChatMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    turn?: boolean | ChatTurnDefaultArgs<ExtArgs>
  }
  export type ChatMessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    turn?: boolean | ChatTurnDefaultArgs<ExtArgs>
  }

  export type $ChatMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ChatMessage"
    objects: {
      turn: Prisma.$ChatTurnPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      turnId: string
      role: string
      senderName: string | null
      senderNormalized: string | null
      content: string
      contentType: string
      quoteText: string | null
      quoteSenderName: string | null
      quoteRole: string | null
      quoteContentType: string | null
      isQuoted: boolean
      isRevoked: boolean
      messageKey: string
      rawExtracted: Prisma.JsonValue | null
      seq: number
      createdAt: Date
    }, ExtArgs["result"]["chatMessage"]>
    composites: {}
  }

  type ChatMessageGetPayload<S extends boolean | null | undefined | ChatMessageDefaultArgs> = $Result.GetResult<Prisma.$ChatMessagePayload, S>

  type ChatMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ChatMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ChatMessageCountAggregateInputType | true
    }

  export interface ChatMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ChatMessage'], meta: { name: 'ChatMessage' } }
    /**
     * Find zero or one ChatMessage that matches the filter.
     * @param {ChatMessageFindUniqueArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ChatMessageFindUniqueArgs>(args: SelectSubset<T, ChatMessageFindUniqueArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ChatMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ChatMessageFindUniqueOrThrowArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ChatMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, ChatMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChatMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageFindFirstArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ChatMessageFindFirstArgs>(args?: SelectSubset<T, ChatMessageFindFirstArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ChatMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageFindFirstOrThrowArgs} args - Arguments to find a ChatMessage
     * @example
     * // Get one ChatMessage
     * const chatMessage = await prisma.chatMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ChatMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, ChatMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ChatMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ChatMessages
     * const chatMessages = await prisma.chatMessage.findMany()
     * 
     * // Get first 10 ChatMessages
     * const chatMessages = await prisma.chatMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const chatMessageWithIdOnly = await prisma.chatMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ChatMessageFindManyArgs>(args?: SelectSubset<T, ChatMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ChatMessage.
     * @param {ChatMessageCreateArgs} args - Arguments to create a ChatMessage.
     * @example
     * // Create one ChatMessage
     * const ChatMessage = await prisma.chatMessage.create({
     *   data: {
     *     // ... data to create a ChatMessage
     *   }
     * })
     * 
     */
    create<T extends ChatMessageCreateArgs>(args: SelectSubset<T, ChatMessageCreateArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ChatMessages.
     * @param {ChatMessageCreateManyArgs} args - Arguments to create many ChatMessages.
     * @example
     * // Create many ChatMessages
     * const chatMessage = await prisma.chatMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ChatMessageCreateManyArgs>(args?: SelectSubset<T, ChatMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ChatMessages and returns the data saved in the database.
     * @param {ChatMessageCreateManyAndReturnArgs} args - Arguments to create many ChatMessages.
     * @example
     * // Create many ChatMessages
     * const chatMessage = await prisma.chatMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ChatMessages and only return the `id`
     * const chatMessageWithIdOnly = await prisma.chatMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ChatMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, ChatMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ChatMessage.
     * @param {ChatMessageDeleteArgs} args - Arguments to delete one ChatMessage.
     * @example
     * // Delete one ChatMessage
     * const ChatMessage = await prisma.chatMessage.delete({
     *   where: {
     *     // ... filter to delete one ChatMessage
     *   }
     * })
     * 
     */
    delete<T extends ChatMessageDeleteArgs>(args: SelectSubset<T, ChatMessageDeleteArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ChatMessage.
     * @param {ChatMessageUpdateArgs} args - Arguments to update one ChatMessage.
     * @example
     * // Update one ChatMessage
     * const chatMessage = await prisma.chatMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ChatMessageUpdateArgs>(args: SelectSubset<T, ChatMessageUpdateArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ChatMessages.
     * @param {ChatMessageDeleteManyArgs} args - Arguments to filter ChatMessages to delete.
     * @example
     * // Delete a few ChatMessages
     * const { count } = await prisma.chatMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ChatMessageDeleteManyArgs>(args?: SelectSubset<T, ChatMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChatMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ChatMessages
     * const chatMessage = await prisma.chatMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ChatMessageUpdateManyArgs>(args: SelectSubset<T, ChatMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ChatMessages and returns the data updated in the database.
     * @param {ChatMessageUpdateManyAndReturnArgs} args - Arguments to update many ChatMessages.
     * @example
     * // Update many ChatMessages
     * const chatMessage = await prisma.chatMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ChatMessages and only return the `id`
     * const chatMessageWithIdOnly = await prisma.chatMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ChatMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, ChatMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ChatMessage.
     * @param {ChatMessageUpsertArgs} args - Arguments to update or create a ChatMessage.
     * @example
     * // Update or create a ChatMessage
     * const chatMessage = await prisma.chatMessage.upsert({
     *   create: {
     *     // ... data to create a ChatMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ChatMessage we want to update
     *   }
     * })
     */
    upsert<T extends ChatMessageUpsertArgs>(args: SelectSubset<T, ChatMessageUpsertArgs<ExtArgs>>): Prisma__ChatMessageClient<$Result.GetResult<Prisma.$ChatMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ChatMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageCountArgs} args - Arguments to filter ChatMessages to count.
     * @example
     * // Count the number of ChatMessages
     * const count = await prisma.chatMessage.count({
     *   where: {
     *     // ... the filter for the ChatMessages we want to count
     *   }
     * })
    **/
    count<T extends ChatMessageCountArgs>(
      args?: Subset<T, ChatMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ChatMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ChatMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ChatMessageAggregateArgs>(args: Subset<T, ChatMessageAggregateArgs>): Prisma.PrismaPromise<GetChatMessageAggregateType<T>>

    /**
     * Group by ChatMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ChatMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ChatMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ChatMessageGroupByArgs['orderBy'] }
        : { orderBy?: ChatMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ChatMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetChatMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ChatMessage model
   */
  readonly fields: ChatMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ChatMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ChatMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    turn<T extends ChatTurnDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ChatTurnDefaultArgs<ExtArgs>>): Prisma__ChatTurnClient<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ChatMessage model
   */
  interface ChatMessageFieldRefs {
    readonly id: FieldRef<"ChatMessage", 'String'>
    readonly turnId: FieldRef<"ChatMessage", 'String'>
    readonly role: FieldRef<"ChatMessage", 'String'>
    readonly senderName: FieldRef<"ChatMessage", 'String'>
    readonly senderNormalized: FieldRef<"ChatMessage", 'String'>
    readonly content: FieldRef<"ChatMessage", 'String'>
    readonly contentType: FieldRef<"ChatMessage", 'String'>
    readonly quoteText: FieldRef<"ChatMessage", 'String'>
    readonly quoteSenderName: FieldRef<"ChatMessage", 'String'>
    readonly quoteRole: FieldRef<"ChatMessage", 'String'>
    readonly quoteContentType: FieldRef<"ChatMessage", 'String'>
    readonly isQuoted: FieldRef<"ChatMessage", 'Boolean'>
    readonly isRevoked: FieldRef<"ChatMessage", 'Boolean'>
    readonly messageKey: FieldRef<"ChatMessage", 'String'>
    readonly rawExtracted: FieldRef<"ChatMessage", 'Json'>
    readonly seq: FieldRef<"ChatMessage", 'Int'>
    readonly createdAt: FieldRef<"ChatMessage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ChatMessage findUnique
   */
  export type ChatMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where: ChatMessageWhereUniqueInput
  }

  /**
   * ChatMessage findUniqueOrThrow
   */
  export type ChatMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where: ChatMessageWhereUniqueInput
  }

  /**
   * ChatMessage findFirst
   */
  export type ChatMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: ChatMessageOrderByWithRelationInput | ChatMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChatMessages.
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatMessages.
     */
    distinct?: ChatMessageScalarFieldEnum | ChatMessageScalarFieldEnum[]
  }

  /**
   * ChatMessage findFirstOrThrow
   */
  export type ChatMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessage to fetch.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: ChatMessageOrderByWithRelationInput | ChatMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ChatMessages.
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatMessages.
     */
    distinct?: ChatMessageScalarFieldEnum | ChatMessageScalarFieldEnum[]
  }

  /**
   * ChatMessage findMany
   */
  export type ChatMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter, which ChatMessages to fetch.
     */
    where?: ChatMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ChatMessages to fetch.
     */
    orderBy?: ChatMessageOrderByWithRelationInput | ChatMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ChatMessages.
     */
    cursor?: ChatMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ChatMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ChatMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ChatMessages.
     */
    distinct?: ChatMessageScalarFieldEnum | ChatMessageScalarFieldEnum[]
  }

  /**
   * ChatMessage create
   */
  export type ChatMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a ChatMessage.
     */
    data: XOR<ChatMessageCreateInput, ChatMessageUncheckedCreateInput>
  }

  /**
   * ChatMessage createMany
   */
  export type ChatMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ChatMessages.
     */
    data: ChatMessageCreateManyInput | ChatMessageCreateManyInput[]
  }

  /**
   * ChatMessage createManyAndReturn
   */
  export type ChatMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * The data used to create many ChatMessages.
     */
    data: ChatMessageCreateManyInput | ChatMessageCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChatMessage update
   */
  export type ChatMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a ChatMessage.
     */
    data: XOR<ChatMessageUpdateInput, ChatMessageUncheckedUpdateInput>
    /**
     * Choose, which ChatMessage to update.
     */
    where: ChatMessageWhereUniqueInput
  }

  /**
   * ChatMessage updateMany
   */
  export type ChatMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ChatMessages.
     */
    data: XOR<ChatMessageUpdateManyMutationInput, ChatMessageUncheckedUpdateManyInput>
    /**
     * Filter which ChatMessages to update
     */
    where?: ChatMessageWhereInput
    /**
     * Limit how many ChatMessages to update.
     */
    limit?: number
  }

  /**
   * ChatMessage updateManyAndReturn
   */
  export type ChatMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * The data used to update ChatMessages.
     */
    data: XOR<ChatMessageUpdateManyMutationInput, ChatMessageUncheckedUpdateManyInput>
    /**
     * Filter which ChatMessages to update
     */
    where?: ChatMessageWhereInput
    /**
     * Limit how many ChatMessages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ChatMessage upsert
   */
  export type ChatMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the ChatMessage to update in case it exists.
     */
    where: ChatMessageWhereUniqueInput
    /**
     * In case the ChatMessage found by the `where` argument doesn't exist, create a new ChatMessage with this data.
     */
    create: XOR<ChatMessageCreateInput, ChatMessageUncheckedCreateInput>
    /**
     * In case the ChatMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ChatMessageUpdateInput, ChatMessageUncheckedUpdateInput>
  }

  /**
   * ChatMessage delete
   */
  export type ChatMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
    /**
     * Filter which ChatMessage to delete.
     */
    where: ChatMessageWhereUniqueInput
  }

  /**
   * ChatMessage deleteMany
   */
  export type ChatMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ChatMessages to delete
     */
    where?: ChatMessageWhereInput
    /**
     * Limit how many ChatMessages to delete.
     */
    limit?: number
  }

  /**
   * ChatMessage without action
   */
  export type ChatMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatMessage
     */
    select?: ChatMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatMessage
     */
    omit?: ChatMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatMessageInclude<ExtArgs> | null
  }


  /**
   * Model Task
   */

  export type AggregateTask = {
    _count: TaskCountAggregateOutputType | null
    _min: TaskMinAggregateOutputType | null
    _max: TaskMaxAggregateOutputType | null
  }

  export type TaskMinAggregateOutputType = {
    id: string | null
    personId: string | null
    logId: string | null
    sourceTurnId: string | null
    title: string | null
    description: string | null
    dueAt: Date | null
    status: string | null
    fingerprint: string | null
    evidence: string | null
    createdAt: Date | null
    updatedAt: Date | null
    completedAt: Date | null
  }

  export type TaskMaxAggregateOutputType = {
    id: string | null
    personId: string | null
    logId: string | null
    sourceTurnId: string | null
    title: string | null
    description: string | null
    dueAt: Date | null
    status: string | null
    fingerprint: string | null
    evidence: string | null
    createdAt: Date | null
    updatedAt: Date | null
    completedAt: Date | null
  }

  export type TaskCountAggregateOutputType = {
    id: number
    personId: number
    logId: number
    sourceTurnId: number
    title: number
    description: number
    dueAt: number
    status: number
    fingerprint: number
    evidence: number
    rawAiResponse: number
    createdAt: number
    updatedAt: number
    completedAt: number
    _all: number
  }


  export type TaskMinAggregateInputType = {
    id?: true
    personId?: true
    logId?: true
    sourceTurnId?: true
    title?: true
    description?: true
    dueAt?: true
    status?: true
    fingerprint?: true
    evidence?: true
    createdAt?: true
    updatedAt?: true
    completedAt?: true
  }

  export type TaskMaxAggregateInputType = {
    id?: true
    personId?: true
    logId?: true
    sourceTurnId?: true
    title?: true
    description?: true
    dueAt?: true
    status?: true
    fingerprint?: true
    evidence?: true
    createdAt?: true
    updatedAt?: true
    completedAt?: true
  }

  export type TaskCountAggregateInputType = {
    id?: true
    personId?: true
    logId?: true
    sourceTurnId?: true
    title?: true
    description?: true
    dueAt?: true
    status?: true
    fingerprint?: true
    evidence?: true
    rawAiResponse?: true
    createdAt?: true
    updatedAt?: true
    completedAt?: true
    _all?: true
  }

  export type TaskAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Task to aggregate.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tasks
    **/
    _count?: true | TaskCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TaskMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TaskMaxAggregateInputType
  }

  export type GetTaskAggregateType<T extends TaskAggregateArgs> = {
        [P in keyof T & keyof AggregateTask]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTask[P]>
      : GetScalarType<T[P], AggregateTask[P]>
  }




  export type TaskGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TaskWhereInput
    orderBy?: TaskOrderByWithAggregationInput | TaskOrderByWithAggregationInput[]
    by: TaskScalarFieldEnum[] | TaskScalarFieldEnum
    having?: TaskScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TaskCountAggregateInputType | true
    _min?: TaskMinAggregateInputType
    _max?: TaskMaxAggregateInputType
  }

  export type TaskGroupByOutputType = {
    id: string
    personId: string | null
    logId: string | null
    sourceTurnId: string | null
    title: string
    description: string
    dueAt: Date | null
    status: string
    fingerprint: string
    evidence: string
    rawAiResponse: JsonValue | null
    createdAt: Date
    updatedAt: Date
    completedAt: Date | null
    _count: TaskCountAggregateOutputType | null
    _min: TaskMinAggregateOutputType | null
    _max: TaskMaxAggregateOutputType | null
  }

  type GetTaskGroupByPayload<T extends TaskGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TaskGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TaskGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TaskGroupByOutputType[P]>
            : GetScalarType<T[P], TaskGroupByOutputType[P]>
        }
      >
    >


  export type TaskSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    personId?: boolean
    logId?: boolean
    sourceTurnId?: boolean
    title?: boolean
    description?: boolean
    dueAt?: boolean
    status?: boolean
    fingerprint?: boolean
    evidence?: boolean
    rawAiResponse?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
    person?: boolean | Task$personArgs<ExtArgs>
    log?: boolean | Task$logArgs<ExtArgs>
    sourceTurn?: boolean | Task$sourceTurnArgs<ExtArgs>
  }, ExtArgs["result"]["task"]>

  export type TaskSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    personId?: boolean
    logId?: boolean
    sourceTurnId?: boolean
    title?: boolean
    description?: boolean
    dueAt?: boolean
    status?: boolean
    fingerprint?: boolean
    evidence?: boolean
    rawAiResponse?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
    person?: boolean | Task$personArgs<ExtArgs>
    log?: boolean | Task$logArgs<ExtArgs>
    sourceTurn?: boolean | Task$sourceTurnArgs<ExtArgs>
  }, ExtArgs["result"]["task"]>

  export type TaskSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    personId?: boolean
    logId?: boolean
    sourceTurnId?: boolean
    title?: boolean
    description?: boolean
    dueAt?: boolean
    status?: boolean
    fingerprint?: boolean
    evidence?: boolean
    rawAiResponse?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
    person?: boolean | Task$personArgs<ExtArgs>
    log?: boolean | Task$logArgs<ExtArgs>
    sourceTurn?: boolean | Task$sourceTurnArgs<ExtArgs>
  }, ExtArgs["result"]["task"]>

  export type TaskSelectScalar = {
    id?: boolean
    personId?: boolean
    logId?: boolean
    sourceTurnId?: boolean
    title?: boolean
    description?: boolean
    dueAt?: boolean
    status?: boolean
    fingerprint?: boolean
    evidence?: boolean
    rawAiResponse?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    completedAt?: boolean
  }

  export type TaskOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "personId" | "logId" | "sourceTurnId" | "title" | "description" | "dueAt" | "status" | "fingerprint" | "evidence" | "rawAiResponse" | "createdAt" | "updatedAt" | "completedAt", ExtArgs["result"]["task"]>
  export type TaskInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    person?: boolean | Task$personArgs<ExtArgs>
    log?: boolean | Task$logArgs<ExtArgs>
    sourceTurn?: boolean | Task$sourceTurnArgs<ExtArgs>
  }
  export type TaskIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    person?: boolean | Task$personArgs<ExtArgs>
    log?: boolean | Task$logArgs<ExtArgs>
    sourceTurn?: boolean | Task$sourceTurnArgs<ExtArgs>
  }
  export type TaskIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    person?: boolean | Task$personArgs<ExtArgs>
    log?: boolean | Task$logArgs<ExtArgs>
    sourceTurn?: boolean | Task$sourceTurnArgs<ExtArgs>
  }

  export type $TaskPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Task"
    objects: {
      person: Prisma.$PersonPayload<ExtArgs> | null
      log: Prisma.$LogPayload<ExtArgs> | null
      sourceTurn: Prisma.$ChatTurnPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      personId: string | null
      logId: string | null
      sourceTurnId: string | null
      title: string
      description: string
      dueAt: Date | null
      status: string
      fingerprint: string
      evidence: string
      rawAiResponse: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
      completedAt: Date | null
    }, ExtArgs["result"]["task"]>
    composites: {}
  }

  type TaskGetPayload<S extends boolean | null | undefined | TaskDefaultArgs> = $Result.GetResult<Prisma.$TaskPayload, S>

  type TaskCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TaskFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TaskCountAggregateInputType | true
    }

  export interface TaskDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Task'], meta: { name: 'Task' } }
    /**
     * Find zero or one Task that matches the filter.
     * @param {TaskFindUniqueArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TaskFindUniqueArgs>(args: SelectSubset<T, TaskFindUniqueArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Task that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TaskFindUniqueOrThrowArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TaskFindUniqueOrThrowArgs>(args: SelectSubset<T, TaskFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Task that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindFirstArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TaskFindFirstArgs>(args?: SelectSubset<T, TaskFindFirstArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Task that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindFirstOrThrowArgs} args - Arguments to find a Task
     * @example
     * // Get one Task
     * const task = await prisma.task.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TaskFindFirstOrThrowArgs>(args?: SelectSubset<T, TaskFindFirstOrThrowArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tasks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tasks
     * const tasks = await prisma.task.findMany()
     * 
     * // Get first 10 Tasks
     * const tasks = await prisma.task.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const taskWithIdOnly = await prisma.task.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TaskFindManyArgs>(args?: SelectSubset<T, TaskFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Task.
     * @param {TaskCreateArgs} args - Arguments to create a Task.
     * @example
     * // Create one Task
     * const Task = await prisma.task.create({
     *   data: {
     *     // ... data to create a Task
     *   }
     * })
     * 
     */
    create<T extends TaskCreateArgs>(args: SelectSubset<T, TaskCreateArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tasks.
     * @param {TaskCreateManyArgs} args - Arguments to create many Tasks.
     * @example
     * // Create many Tasks
     * const task = await prisma.task.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TaskCreateManyArgs>(args?: SelectSubset<T, TaskCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tasks and returns the data saved in the database.
     * @param {TaskCreateManyAndReturnArgs} args - Arguments to create many Tasks.
     * @example
     * // Create many Tasks
     * const task = await prisma.task.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tasks and only return the `id`
     * const taskWithIdOnly = await prisma.task.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TaskCreateManyAndReturnArgs>(args?: SelectSubset<T, TaskCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Task.
     * @param {TaskDeleteArgs} args - Arguments to delete one Task.
     * @example
     * // Delete one Task
     * const Task = await prisma.task.delete({
     *   where: {
     *     // ... filter to delete one Task
     *   }
     * })
     * 
     */
    delete<T extends TaskDeleteArgs>(args: SelectSubset<T, TaskDeleteArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Task.
     * @param {TaskUpdateArgs} args - Arguments to update one Task.
     * @example
     * // Update one Task
     * const task = await prisma.task.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TaskUpdateArgs>(args: SelectSubset<T, TaskUpdateArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tasks.
     * @param {TaskDeleteManyArgs} args - Arguments to filter Tasks to delete.
     * @example
     * // Delete a few Tasks
     * const { count } = await prisma.task.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TaskDeleteManyArgs>(args?: SelectSubset<T, TaskDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tasks
     * const task = await prisma.task.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TaskUpdateManyArgs>(args: SelectSubset<T, TaskUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tasks and returns the data updated in the database.
     * @param {TaskUpdateManyAndReturnArgs} args - Arguments to update many Tasks.
     * @example
     * // Update many Tasks
     * const task = await prisma.task.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tasks and only return the `id`
     * const taskWithIdOnly = await prisma.task.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TaskUpdateManyAndReturnArgs>(args: SelectSubset<T, TaskUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Task.
     * @param {TaskUpsertArgs} args - Arguments to update or create a Task.
     * @example
     * // Update or create a Task
     * const task = await prisma.task.upsert({
     *   create: {
     *     // ... data to create a Task
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Task we want to update
     *   }
     * })
     */
    upsert<T extends TaskUpsertArgs>(args: SelectSubset<T, TaskUpsertArgs<ExtArgs>>): Prisma__TaskClient<$Result.GetResult<Prisma.$TaskPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tasks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskCountArgs} args - Arguments to filter Tasks to count.
     * @example
     * // Count the number of Tasks
     * const count = await prisma.task.count({
     *   where: {
     *     // ... the filter for the Tasks we want to count
     *   }
     * })
    **/
    count<T extends TaskCountArgs>(
      args?: Subset<T, TaskCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TaskCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Task.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TaskAggregateArgs>(args: Subset<T, TaskAggregateArgs>): Prisma.PrismaPromise<GetTaskAggregateType<T>>

    /**
     * Group by Task.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TaskGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TaskGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TaskGroupByArgs['orderBy'] }
        : { orderBy?: TaskGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TaskGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTaskGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Task model
   */
  readonly fields: TaskFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Task.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TaskClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    person<T extends Task$personArgs<ExtArgs> = {}>(args?: Subset<T, Task$personArgs<ExtArgs>>): Prisma__PersonClient<$Result.GetResult<Prisma.$PersonPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    log<T extends Task$logArgs<ExtArgs> = {}>(args?: Subset<T, Task$logArgs<ExtArgs>>): Prisma__LogClient<$Result.GetResult<Prisma.$LogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    sourceTurn<T extends Task$sourceTurnArgs<ExtArgs> = {}>(args?: Subset<T, Task$sourceTurnArgs<ExtArgs>>): Prisma__ChatTurnClient<$Result.GetResult<Prisma.$ChatTurnPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Task model
   */
  interface TaskFieldRefs {
    readonly id: FieldRef<"Task", 'String'>
    readonly personId: FieldRef<"Task", 'String'>
    readonly logId: FieldRef<"Task", 'String'>
    readonly sourceTurnId: FieldRef<"Task", 'String'>
    readonly title: FieldRef<"Task", 'String'>
    readonly description: FieldRef<"Task", 'String'>
    readonly dueAt: FieldRef<"Task", 'DateTime'>
    readonly status: FieldRef<"Task", 'String'>
    readonly fingerprint: FieldRef<"Task", 'String'>
    readonly evidence: FieldRef<"Task", 'String'>
    readonly rawAiResponse: FieldRef<"Task", 'Json'>
    readonly createdAt: FieldRef<"Task", 'DateTime'>
    readonly updatedAt: FieldRef<"Task", 'DateTime'>
    readonly completedAt: FieldRef<"Task", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Task findUnique
   */
  export type TaskFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task findUniqueOrThrow
   */
  export type TaskFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task findFirst
   */
  export type TaskFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tasks.
     */
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Task findFirstOrThrow
   */
  export type TaskFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Task to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tasks.
     */
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Task findMany
   */
  export type TaskFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter, which Tasks to fetch.
     */
    where?: TaskWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tasks to fetch.
     */
    orderBy?: TaskOrderByWithRelationInput | TaskOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tasks.
     */
    cursor?: TaskWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tasks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tasks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tasks.
     */
    distinct?: TaskScalarFieldEnum | TaskScalarFieldEnum[]
  }

  /**
   * Task create
   */
  export type TaskCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * The data needed to create a Task.
     */
    data: XOR<TaskCreateInput, TaskUncheckedCreateInput>
  }

  /**
   * Task createMany
   */
  export type TaskCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tasks.
     */
    data: TaskCreateManyInput | TaskCreateManyInput[]
  }

  /**
   * Task createManyAndReturn
   */
  export type TaskCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * The data used to create many Tasks.
     */
    data: TaskCreateManyInput | TaskCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Task update
   */
  export type TaskUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * The data needed to update a Task.
     */
    data: XOR<TaskUpdateInput, TaskUncheckedUpdateInput>
    /**
     * Choose, which Task to update.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task updateMany
   */
  export type TaskUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tasks.
     */
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyInput>
    /**
     * Filter which Tasks to update
     */
    where?: TaskWhereInput
    /**
     * Limit how many Tasks to update.
     */
    limit?: number
  }

  /**
   * Task updateManyAndReturn
   */
  export type TaskUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * The data used to update Tasks.
     */
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyInput>
    /**
     * Filter which Tasks to update
     */
    where?: TaskWhereInput
    /**
     * Limit how many Tasks to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Task upsert
   */
  export type TaskUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * The filter to search for the Task to update in case it exists.
     */
    where: TaskWhereUniqueInput
    /**
     * In case the Task found by the `where` argument doesn't exist, create a new Task with this data.
     */
    create: XOR<TaskCreateInput, TaskUncheckedCreateInput>
    /**
     * In case the Task was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TaskUpdateInput, TaskUncheckedUpdateInput>
  }

  /**
   * Task delete
   */
  export type TaskDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
    /**
     * Filter which Task to delete.
     */
    where: TaskWhereUniqueInput
  }

  /**
   * Task deleteMany
   */
  export type TaskDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tasks to delete
     */
    where?: TaskWhereInput
    /**
     * Limit how many Tasks to delete.
     */
    limit?: number
  }

  /**
   * Task.person
   */
  export type Task$personArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null
    where?: PersonWhereInput
  }

  /**
   * Task.log
   */
  export type Task$logArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Log
     */
    select?: LogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Log
     */
    omit?: LogOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LogInclude<ExtArgs> | null
    where?: LogWhereInput
  }

  /**
   * Task.sourceTurn
   */
  export type Task$sourceTurnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ChatTurn
     */
    select?: ChatTurnSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ChatTurn
     */
    omit?: ChatTurnOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ChatTurnInclude<ExtArgs> | null
    where?: ChatTurnWhereInput
  }

  /**
   * Task without action
   */
  export type TaskDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Task
     */
    select?: TaskSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Task
     */
    omit?: TaskOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TaskInclude<ExtArgs> | null
  }


  /**
   * Model AgentSession
   */

  export type AggregateAgentSession = {
    _count: AgentSessionCountAggregateOutputType | null
    _min: AgentSessionMinAggregateOutputType | null
    _max: AgentSessionMaxAggregateOutputType | null
  }

  export type AgentSessionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    title: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AgentSessionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    title: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AgentSessionCountAggregateOutputType = {
    id: number
    userId: number
    title: number
    screenContext: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AgentSessionMinAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AgentSessionMaxAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AgentSessionCountAggregateInputType = {
    id?: true
    userId?: true
    title?: true
    screenContext?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AgentSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AgentSession to aggregate.
     */
    where?: AgentSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentSessions to fetch.
     */
    orderBy?: AgentSessionOrderByWithRelationInput | AgentSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AgentSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AgentSessions
    **/
    _count?: true | AgentSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AgentSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AgentSessionMaxAggregateInputType
  }

  export type GetAgentSessionAggregateType<T extends AgentSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateAgentSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAgentSession[P]>
      : GetScalarType<T[P], AggregateAgentSession[P]>
  }




  export type AgentSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgentSessionWhereInput
    orderBy?: AgentSessionOrderByWithAggregationInput | AgentSessionOrderByWithAggregationInput[]
    by: AgentSessionScalarFieldEnum[] | AgentSessionScalarFieldEnum
    having?: AgentSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AgentSessionCountAggregateInputType | true
    _min?: AgentSessionMinAggregateInputType
    _max?: AgentSessionMaxAggregateInputType
  }

  export type AgentSessionGroupByOutputType = {
    id: string
    userId: string
    title: string
    screenContext: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: AgentSessionCountAggregateOutputType | null
    _min: AgentSessionMinAggregateOutputType | null
    _max: AgentSessionMaxAggregateOutputType | null
  }

  type GetAgentSessionGroupByPayload<T extends AgentSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AgentSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AgentSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AgentSessionGroupByOutputType[P]>
            : GetScalarType<T[P], AgentSessionGroupByOutputType[P]>
        }
      >
    >


  export type AgentSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    title?: boolean
    screenContext?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    messages?: boolean | AgentSession$messagesArgs<ExtArgs>
    _count?: boolean | AgentSessionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agentSession"]>

  export type AgentSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    title?: boolean
    screenContext?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["agentSession"]>

  export type AgentSessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    title?: boolean
    screenContext?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["agentSession"]>

  export type AgentSessionSelectScalar = {
    id?: boolean
    userId?: boolean
    title?: boolean
    screenContext?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AgentSessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "title" | "screenContext" | "createdAt" | "updatedAt", ExtArgs["result"]["agentSession"]>
  export type AgentSessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | AgentSession$messagesArgs<ExtArgs>
    _count?: boolean | AgentSessionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AgentSessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type AgentSessionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $AgentSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AgentSession"
    objects: {
      messages: Prisma.$AgentMessagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      title: string
      screenContext: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["agentSession"]>
    composites: {}
  }

  type AgentSessionGetPayload<S extends boolean | null | undefined | AgentSessionDefaultArgs> = $Result.GetResult<Prisma.$AgentSessionPayload, S>

  type AgentSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AgentSessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AgentSessionCountAggregateInputType | true
    }

  export interface AgentSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AgentSession'], meta: { name: 'AgentSession' } }
    /**
     * Find zero or one AgentSession that matches the filter.
     * @param {AgentSessionFindUniqueArgs} args - Arguments to find a AgentSession
     * @example
     * // Get one AgentSession
     * const agentSession = await prisma.agentSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AgentSessionFindUniqueArgs>(args: SelectSubset<T, AgentSessionFindUniqueArgs<ExtArgs>>): Prisma__AgentSessionClient<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AgentSession that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AgentSessionFindUniqueOrThrowArgs} args - Arguments to find a AgentSession
     * @example
     * // Get one AgentSession
     * const agentSession = await prisma.agentSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AgentSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, AgentSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AgentSessionClient<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AgentSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentSessionFindFirstArgs} args - Arguments to find a AgentSession
     * @example
     * // Get one AgentSession
     * const agentSession = await prisma.agentSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AgentSessionFindFirstArgs>(args?: SelectSubset<T, AgentSessionFindFirstArgs<ExtArgs>>): Prisma__AgentSessionClient<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AgentSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentSessionFindFirstOrThrowArgs} args - Arguments to find a AgentSession
     * @example
     * // Get one AgentSession
     * const agentSession = await prisma.agentSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AgentSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, AgentSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__AgentSessionClient<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AgentSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AgentSessions
     * const agentSessions = await prisma.agentSession.findMany()
     * 
     * // Get first 10 AgentSessions
     * const agentSessions = await prisma.agentSession.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const agentSessionWithIdOnly = await prisma.agentSession.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AgentSessionFindManyArgs>(args?: SelectSubset<T, AgentSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AgentSession.
     * @param {AgentSessionCreateArgs} args - Arguments to create a AgentSession.
     * @example
     * // Create one AgentSession
     * const AgentSession = await prisma.agentSession.create({
     *   data: {
     *     // ... data to create a AgentSession
     *   }
     * })
     * 
     */
    create<T extends AgentSessionCreateArgs>(args: SelectSubset<T, AgentSessionCreateArgs<ExtArgs>>): Prisma__AgentSessionClient<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AgentSessions.
     * @param {AgentSessionCreateManyArgs} args - Arguments to create many AgentSessions.
     * @example
     * // Create many AgentSessions
     * const agentSession = await prisma.agentSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AgentSessionCreateManyArgs>(args?: SelectSubset<T, AgentSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AgentSessions and returns the data saved in the database.
     * @param {AgentSessionCreateManyAndReturnArgs} args - Arguments to create many AgentSessions.
     * @example
     * // Create many AgentSessions
     * const agentSession = await prisma.agentSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AgentSessions and only return the `id`
     * const agentSessionWithIdOnly = await prisma.agentSession.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AgentSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, AgentSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AgentSession.
     * @param {AgentSessionDeleteArgs} args - Arguments to delete one AgentSession.
     * @example
     * // Delete one AgentSession
     * const AgentSession = await prisma.agentSession.delete({
     *   where: {
     *     // ... filter to delete one AgentSession
     *   }
     * })
     * 
     */
    delete<T extends AgentSessionDeleteArgs>(args: SelectSubset<T, AgentSessionDeleteArgs<ExtArgs>>): Prisma__AgentSessionClient<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AgentSession.
     * @param {AgentSessionUpdateArgs} args - Arguments to update one AgentSession.
     * @example
     * // Update one AgentSession
     * const agentSession = await prisma.agentSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AgentSessionUpdateArgs>(args: SelectSubset<T, AgentSessionUpdateArgs<ExtArgs>>): Prisma__AgentSessionClient<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AgentSessions.
     * @param {AgentSessionDeleteManyArgs} args - Arguments to filter AgentSessions to delete.
     * @example
     * // Delete a few AgentSessions
     * const { count } = await prisma.agentSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AgentSessionDeleteManyArgs>(args?: SelectSubset<T, AgentSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AgentSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AgentSessions
     * const agentSession = await prisma.agentSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AgentSessionUpdateManyArgs>(args: SelectSubset<T, AgentSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AgentSessions and returns the data updated in the database.
     * @param {AgentSessionUpdateManyAndReturnArgs} args - Arguments to update many AgentSessions.
     * @example
     * // Update many AgentSessions
     * const agentSession = await prisma.agentSession.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AgentSessions and only return the `id`
     * const agentSessionWithIdOnly = await prisma.agentSession.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AgentSessionUpdateManyAndReturnArgs>(args: SelectSubset<T, AgentSessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AgentSession.
     * @param {AgentSessionUpsertArgs} args - Arguments to update or create a AgentSession.
     * @example
     * // Update or create a AgentSession
     * const agentSession = await prisma.agentSession.upsert({
     *   create: {
     *     // ... data to create a AgentSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AgentSession we want to update
     *   }
     * })
     */
    upsert<T extends AgentSessionUpsertArgs>(args: SelectSubset<T, AgentSessionUpsertArgs<ExtArgs>>): Prisma__AgentSessionClient<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AgentSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentSessionCountArgs} args - Arguments to filter AgentSessions to count.
     * @example
     * // Count the number of AgentSessions
     * const count = await prisma.agentSession.count({
     *   where: {
     *     // ... the filter for the AgentSessions we want to count
     *   }
     * })
    **/
    count<T extends AgentSessionCountArgs>(
      args?: Subset<T, AgentSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AgentSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AgentSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AgentSessionAggregateArgs>(args: Subset<T, AgentSessionAggregateArgs>): Prisma.PrismaPromise<GetAgentSessionAggregateType<T>>

    /**
     * Group by AgentSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentSessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AgentSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AgentSessionGroupByArgs['orderBy'] }
        : { orderBy?: AgentSessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AgentSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AgentSession model
   */
  readonly fields: AgentSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AgentSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AgentSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    messages<T extends AgentSession$messagesArgs<ExtArgs> = {}>(args?: Subset<T, AgentSession$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AgentSession model
   */
  interface AgentSessionFieldRefs {
    readonly id: FieldRef<"AgentSession", 'String'>
    readonly userId: FieldRef<"AgentSession", 'String'>
    readonly title: FieldRef<"AgentSession", 'String'>
    readonly screenContext: FieldRef<"AgentSession", 'Json'>
    readonly createdAt: FieldRef<"AgentSession", 'DateTime'>
    readonly updatedAt: FieldRef<"AgentSession", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AgentSession findUnique
   */
  export type AgentSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentSessionInclude<ExtArgs> | null
    /**
     * Filter, which AgentSession to fetch.
     */
    where: AgentSessionWhereUniqueInput
  }

  /**
   * AgentSession findUniqueOrThrow
   */
  export type AgentSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentSessionInclude<ExtArgs> | null
    /**
     * Filter, which AgentSession to fetch.
     */
    where: AgentSessionWhereUniqueInput
  }

  /**
   * AgentSession findFirst
   */
  export type AgentSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentSessionInclude<ExtArgs> | null
    /**
     * Filter, which AgentSession to fetch.
     */
    where?: AgentSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentSessions to fetch.
     */
    orderBy?: AgentSessionOrderByWithRelationInput | AgentSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AgentSessions.
     */
    cursor?: AgentSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentSessions.
     */
    distinct?: AgentSessionScalarFieldEnum | AgentSessionScalarFieldEnum[]
  }

  /**
   * AgentSession findFirstOrThrow
   */
  export type AgentSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentSessionInclude<ExtArgs> | null
    /**
     * Filter, which AgentSession to fetch.
     */
    where?: AgentSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentSessions to fetch.
     */
    orderBy?: AgentSessionOrderByWithRelationInput | AgentSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AgentSessions.
     */
    cursor?: AgentSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentSessions.
     */
    distinct?: AgentSessionScalarFieldEnum | AgentSessionScalarFieldEnum[]
  }

  /**
   * AgentSession findMany
   */
  export type AgentSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentSessionInclude<ExtArgs> | null
    /**
     * Filter, which AgentSessions to fetch.
     */
    where?: AgentSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentSessions to fetch.
     */
    orderBy?: AgentSessionOrderByWithRelationInput | AgentSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AgentSessions.
     */
    cursor?: AgentSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentSessions.
     */
    distinct?: AgentSessionScalarFieldEnum | AgentSessionScalarFieldEnum[]
  }

  /**
   * AgentSession create
   */
  export type AgentSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentSessionInclude<ExtArgs> | null
    /**
     * The data needed to create a AgentSession.
     */
    data: XOR<AgentSessionCreateInput, AgentSessionUncheckedCreateInput>
  }

  /**
   * AgentSession createMany
   */
  export type AgentSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AgentSessions.
     */
    data: AgentSessionCreateManyInput | AgentSessionCreateManyInput[]
  }

  /**
   * AgentSession createManyAndReturn
   */
  export type AgentSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * The data used to create many AgentSessions.
     */
    data: AgentSessionCreateManyInput | AgentSessionCreateManyInput[]
  }

  /**
   * AgentSession update
   */
  export type AgentSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentSessionInclude<ExtArgs> | null
    /**
     * The data needed to update a AgentSession.
     */
    data: XOR<AgentSessionUpdateInput, AgentSessionUncheckedUpdateInput>
    /**
     * Choose, which AgentSession to update.
     */
    where: AgentSessionWhereUniqueInput
  }

  /**
   * AgentSession updateMany
   */
  export type AgentSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AgentSessions.
     */
    data: XOR<AgentSessionUpdateManyMutationInput, AgentSessionUncheckedUpdateManyInput>
    /**
     * Filter which AgentSessions to update
     */
    where?: AgentSessionWhereInput
    /**
     * Limit how many AgentSessions to update.
     */
    limit?: number
  }

  /**
   * AgentSession updateManyAndReturn
   */
  export type AgentSessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * The data used to update AgentSessions.
     */
    data: XOR<AgentSessionUpdateManyMutationInput, AgentSessionUncheckedUpdateManyInput>
    /**
     * Filter which AgentSessions to update
     */
    where?: AgentSessionWhereInput
    /**
     * Limit how many AgentSessions to update.
     */
    limit?: number
  }

  /**
   * AgentSession upsert
   */
  export type AgentSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentSessionInclude<ExtArgs> | null
    /**
     * The filter to search for the AgentSession to update in case it exists.
     */
    where: AgentSessionWhereUniqueInput
    /**
     * In case the AgentSession found by the `where` argument doesn't exist, create a new AgentSession with this data.
     */
    create: XOR<AgentSessionCreateInput, AgentSessionUncheckedCreateInput>
    /**
     * In case the AgentSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AgentSessionUpdateInput, AgentSessionUncheckedUpdateInput>
  }

  /**
   * AgentSession delete
   */
  export type AgentSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentSessionInclude<ExtArgs> | null
    /**
     * Filter which AgentSession to delete.
     */
    where: AgentSessionWhereUniqueInput
  }

  /**
   * AgentSession deleteMany
   */
  export type AgentSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AgentSessions to delete
     */
    where?: AgentSessionWhereInput
    /**
     * Limit how many AgentSessions to delete.
     */
    limit?: number
  }

  /**
   * AgentSession.messages
   */
  export type AgentSession$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
    where?: AgentMessageWhereInput
    orderBy?: AgentMessageOrderByWithRelationInput | AgentMessageOrderByWithRelationInput[]
    cursor?: AgentMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AgentMessageScalarFieldEnum | AgentMessageScalarFieldEnum[]
  }

  /**
   * AgentSession without action
   */
  export type AgentSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentSession
     */
    select?: AgentSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentSession
     */
    omit?: AgentSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentSessionInclude<ExtArgs> | null
  }


  /**
   * Model AgentMessage
   */

  export type AggregateAgentMessage = {
    _count: AgentMessageCountAggregateOutputType | null
    _avg: AgentMessageAvgAggregateOutputType | null
    _sum: AgentMessageSumAggregateOutputType | null
    _min: AgentMessageMinAggregateOutputType | null
    _max: AgentMessageMaxAggregateOutputType | null
  }

  export type AgentMessageAvgAggregateOutputType = {
    seq: number | null
  }

  export type AgentMessageSumAggregateOutputType = {
    seq: number | null
  }

  export type AgentMessageMinAggregateOutputType = {
    id: string | null
    sessionId: string | null
    role: string | null
    kind: string | null
    content: string | null
    toolName: string | null
    isError: boolean | null
    seq: number | null
    createdAt: Date | null
  }

  export type AgentMessageMaxAggregateOutputType = {
    id: string | null
    sessionId: string | null
    role: string | null
    kind: string | null
    content: string | null
    toolName: string | null
    isError: boolean | null
    seq: number | null
    createdAt: Date | null
  }

  export type AgentMessageCountAggregateOutputType = {
    id: number
    sessionId: number
    role: number
    kind: number
    content: number
    toolName: number
    toolInput: number
    toolResult: number
    isError: number
    seq: number
    createdAt: number
    _all: number
  }


  export type AgentMessageAvgAggregateInputType = {
    seq?: true
  }

  export type AgentMessageSumAggregateInputType = {
    seq?: true
  }

  export type AgentMessageMinAggregateInputType = {
    id?: true
    sessionId?: true
    role?: true
    kind?: true
    content?: true
    toolName?: true
    isError?: true
    seq?: true
    createdAt?: true
  }

  export type AgentMessageMaxAggregateInputType = {
    id?: true
    sessionId?: true
    role?: true
    kind?: true
    content?: true
    toolName?: true
    isError?: true
    seq?: true
    createdAt?: true
  }

  export type AgentMessageCountAggregateInputType = {
    id?: true
    sessionId?: true
    role?: true
    kind?: true
    content?: true
    toolName?: true
    toolInput?: true
    toolResult?: true
    isError?: true
    seq?: true
    createdAt?: true
    _all?: true
  }

  export type AgentMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AgentMessage to aggregate.
     */
    where?: AgentMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentMessages to fetch.
     */
    orderBy?: AgentMessageOrderByWithRelationInput | AgentMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AgentMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AgentMessages
    **/
    _count?: true | AgentMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AgentMessageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AgentMessageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AgentMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AgentMessageMaxAggregateInputType
  }

  export type GetAgentMessageAggregateType<T extends AgentMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateAgentMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAgentMessage[P]>
      : GetScalarType<T[P], AggregateAgentMessage[P]>
  }




  export type AgentMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AgentMessageWhereInput
    orderBy?: AgentMessageOrderByWithAggregationInput | AgentMessageOrderByWithAggregationInput[]
    by: AgentMessageScalarFieldEnum[] | AgentMessageScalarFieldEnum
    having?: AgentMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AgentMessageCountAggregateInputType | true
    _avg?: AgentMessageAvgAggregateInputType
    _sum?: AgentMessageSumAggregateInputType
    _min?: AgentMessageMinAggregateInputType
    _max?: AgentMessageMaxAggregateInputType
  }

  export type AgentMessageGroupByOutputType = {
    id: string
    sessionId: string
    role: string
    kind: string
    content: string
    toolName: string | null
    toolInput: JsonValue | null
    toolResult: JsonValue | null
    isError: boolean
    seq: number
    createdAt: Date
    _count: AgentMessageCountAggregateOutputType | null
    _avg: AgentMessageAvgAggregateOutputType | null
    _sum: AgentMessageSumAggregateOutputType | null
    _min: AgentMessageMinAggregateOutputType | null
    _max: AgentMessageMaxAggregateOutputType | null
  }

  type GetAgentMessageGroupByPayload<T extends AgentMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AgentMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AgentMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AgentMessageGroupByOutputType[P]>
            : GetScalarType<T[P], AgentMessageGroupByOutputType[P]>
        }
      >
    >


  export type AgentMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    role?: boolean
    kind?: boolean
    content?: boolean
    toolName?: boolean
    toolInput?: boolean
    toolResult?: boolean
    isError?: boolean
    seq?: boolean
    createdAt?: boolean
    session?: boolean | AgentSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agentMessage"]>

  export type AgentMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    role?: boolean
    kind?: boolean
    content?: boolean
    toolName?: boolean
    toolInput?: boolean
    toolResult?: boolean
    isError?: boolean
    seq?: boolean
    createdAt?: boolean
    session?: boolean | AgentSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agentMessage"]>

  export type AgentMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionId?: boolean
    role?: boolean
    kind?: boolean
    content?: boolean
    toolName?: boolean
    toolInput?: boolean
    toolResult?: boolean
    isError?: boolean
    seq?: boolean
    createdAt?: boolean
    session?: boolean | AgentSessionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["agentMessage"]>

  export type AgentMessageSelectScalar = {
    id?: boolean
    sessionId?: boolean
    role?: boolean
    kind?: boolean
    content?: boolean
    toolName?: boolean
    toolInput?: boolean
    toolResult?: boolean
    isError?: boolean
    seq?: boolean
    createdAt?: boolean
  }

  export type AgentMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sessionId" | "role" | "kind" | "content" | "toolName" | "toolInput" | "toolResult" | "isError" | "seq" | "createdAt", ExtArgs["result"]["agentMessage"]>
  export type AgentMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | AgentSessionDefaultArgs<ExtArgs>
  }
  export type AgentMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | AgentSessionDefaultArgs<ExtArgs>
  }
  export type AgentMessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    session?: boolean | AgentSessionDefaultArgs<ExtArgs>
  }

  export type $AgentMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AgentMessage"
    objects: {
      session: Prisma.$AgentSessionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sessionId: string
      role: string
      kind: string
      content: string
      toolName: string | null
      toolInput: Prisma.JsonValue | null
      toolResult: Prisma.JsonValue | null
      isError: boolean
      seq: number
      createdAt: Date
    }, ExtArgs["result"]["agentMessage"]>
    composites: {}
  }

  type AgentMessageGetPayload<S extends boolean | null | undefined | AgentMessageDefaultArgs> = $Result.GetResult<Prisma.$AgentMessagePayload, S>

  type AgentMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AgentMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AgentMessageCountAggregateInputType | true
    }

  export interface AgentMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AgentMessage'], meta: { name: 'AgentMessage' } }
    /**
     * Find zero or one AgentMessage that matches the filter.
     * @param {AgentMessageFindUniqueArgs} args - Arguments to find a AgentMessage
     * @example
     * // Get one AgentMessage
     * const agentMessage = await prisma.agentMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AgentMessageFindUniqueArgs>(args: SelectSubset<T, AgentMessageFindUniqueArgs<ExtArgs>>): Prisma__AgentMessageClient<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AgentMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AgentMessageFindUniqueOrThrowArgs} args - Arguments to find a AgentMessage
     * @example
     * // Get one AgentMessage
     * const agentMessage = await prisma.agentMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AgentMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, AgentMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AgentMessageClient<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AgentMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentMessageFindFirstArgs} args - Arguments to find a AgentMessage
     * @example
     * // Get one AgentMessage
     * const agentMessage = await prisma.agentMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AgentMessageFindFirstArgs>(args?: SelectSubset<T, AgentMessageFindFirstArgs<ExtArgs>>): Prisma__AgentMessageClient<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AgentMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentMessageFindFirstOrThrowArgs} args - Arguments to find a AgentMessage
     * @example
     * // Get one AgentMessage
     * const agentMessage = await prisma.agentMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AgentMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, AgentMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__AgentMessageClient<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AgentMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AgentMessages
     * const agentMessages = await prisma.agentMessage.findMany()
     * 
     * // Get first 10 AgentMessages
     * const agentMessages = await prisma.agentMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const agentMessageWithIdOnly = await prisma.agentMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AgentMessageFindManyArgs>(args?: SelectSubset<T, AgentMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AgentMessage.
     * @param {AgentMessageCreateArgs} args - Arguments to create a AgentMessage.
     * @example
     * // Create one AgentMessage
     * const AgentMessage = await prisma.agentMessage.create({
     *   data: {
     *     // ... data to create a AgentMessage
     *   }
     * })
     * 
     */
    create<T extends AgentMessageCreateArgs>(args: SelectSubset<T, AgentMessageCreateArgs<ExtArgs>>): Prisma__AgentMessageClient<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AgentMessages.
     * @param {AgentMessageCreateManyArgs} args - Arguments to create many AgentMessages.
     * @example
     * // Create many AgentMessages
     * const agentMessage = await prisma.agentMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AgentMessageCreateManyArgs>(args?: SelectSubset<T, AgentMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AgentMessages and returns the data saved in the database.
     * @param {AgentMessageCreateManyAndReturnArgs} args - Arguments to create many AgentMessages.
     * @example
     * // Create many AgentMessages
     * const agentMessage = await prisma.agentMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AgentMessages and only return the `id`
     * const agentMessageWithIdOnly = await prisma.agentMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AgentMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, AgentMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AgentMessage.
     * @param {AgentMessageDeleteArgs} args - Arguments to delete one AgentMessage.
     * @example
     * // Delete one AgentMessage
     * const AgentMessage = await prisma.agentMessage.delete({
     *   where: {
     *     // ... filter to delete one AgentMessage
     *   }
     * })
     * 
     */
    delete<T extends AgentMessageDeleteArgs>(args: SelectSubset<T, AgentMessageDeleteArgs<ExtArgs>>): Prisma__AgentMessageClient<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AgentMessage.
     * @param {AgentMessageUpdateArgs} args - Arguments to update one AgentMessage.
     * @example
     * // Update one AgentMessage
     * const agentMessage = await prisma.agentMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AgentMessageUpdateArgs>(args: SelectSubset<T, AgentMessageUpdateArgs<ExtArgs>>): Prisma__AgentMessageClient<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AgentMessages.
     * @param {AgentMessageDeleteManyArgs} args - Arguments to filter AgentMessages to delete.
     * @example
     * // Delete a few AgentMessages
     * const { count } = await prisma.agentMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AgentMessageDeleteManyArgs>(args?: SelectSubset<T, AgentMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AgentMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AgentMessages
     * const agentMessage = await prisma.agentMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AgentMessageUpdateManyArgs>(args: SelectSubset<T, AgentMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AgentMessages and returns the data updated in the database.
     * @param {AgentMessageUpdateManyAndReturnArgs} args - Arguments to update many AgentMessages.
     * @example
     * // Update many AgentMessages
     * const agentMessage = await prisma.agentMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AgentMessages and only return the `id`
     * const agentMessageWithIdOnly = await prisma.agentMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AgentMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, AgentMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AgentMessage.
     * @param {AgentMessageUpsertArgs} args - Arguments to update or create a AgentMessage.
     * @example
     * // Update or create a AgentMessage
     * const agentMessage = await prisma.agentMessage.upsert({
     *   create: {
     *     // ... data to create a AgentMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AgentMessage we want to update
     *   }
     * })
     */
    upsert<T extends AgentMessageUpsertArgs>(args: SelectSubset<T, AgentMessageUpsertArgs<ExtArgs>>): Prisma__AgentMessageClient<$Result.GetResult<Prisma.$AgentMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AgentMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentMessageCountArgs} args - Arguments to filter AgentMessages to count.
     * @example
     * // Count the number of AgentMessages
     * const count = await prisma.agentMessage.count({
     *   where: {
     *     // ... the filter for the AgentMessages we want to count
     *   }
     * })
    **/
    count<T extends AgentMessageCountArgs>(
      args?: Subset<T, AgentMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AgentMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AgentMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AgentMessageAggregateArgs>(args: Subset<T, AgentMessageAggregateArgs>): Prisma.PrismaPromise<GetAgentMessageAggregateType<T>>

    /**
     * Group by AgentMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AgentMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AgentMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AgentMessageGroupByArgs['orderBy'] }
        : { orderBy?: AgentMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AgentMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAgentMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AgentMessage model
   */
  readonly fields: AgentMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AgentMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AgentMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    session<T extends AgentSessionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AgentSessionDefaultArgs<ExtArgs>>): Prisma__AgentSessionClient<$Result.GetResult<Prisma.$AgentSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AgentMessage model
   */
  interface AgentMessageFieldRefs {
    readonly id: FieldRef<"AgentMessage", 'String'>
    readonly sessionId: FieldRef<"AgentMessage", 'String'>
    readonly role: FieldRef<"AgentMessage", 'String'>
    readonly kind: FieldRef<"AgentMessage", 'String'>
    readonly content: FieldRef<"AgentMessage", 'String'>
    readonly toolName: FieldRef<"AgentMessage", 'String'>
    readonly toolInput: FieldRef<"AgentMessage", 'Json'>
    readonly toolResult: FieldRef<"AgentMessage", 'Json'>
    readonly isError: FieldRef<"AgentMessage", 'Boolean'>
    readonly seq: FieldRef<"AgentMessage", 'Int'>
    readonly createdAt: FieldRef<"AgentMessage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AgentMessage findUnique
   */
  export type AgentMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
    /**
     * Filter, which AgentMessage to fetch.
     */
    where: AgentMessageWhereUniqueInput
  }

  /**
   * AgentMessage findUniqueOrThrow
   */
  export type AgentMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
    /**
     * Filter, which AgentMessage to fetch.
     */
    where: AgentMessageWhereUniqueInput
  }

  /**
   * AgentMessage findFirst
   */
  export type AgentMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
    /**
     * Filter, which AgentMessage to fetch.
     */
    where?: AgentMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentMessages to fetch.
     */
    orderBy?: AgentMessageOrderByWithRelationInput | AgentMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AgentMessages.
     */
    cursor?: AgentMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentMessages.
     */
    distinct?: AgentMessageScalarFieldEnum | AgentMessageScalarFieldEnum[]
  }

  /**
   * AgentMessage findFirstOrThrow
   */
  export type AgentMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
    /**
     * Filter, which AgentMessage to fetch.
     */
    where?: AgentMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentMessages to fetch.
     */
    orderBy?: AgentMessageOrderByWithRelationInput | AgentMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AgentMessages.
     */
    cursor?: AgentMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentMessages.
     */
    distinct?: AgentMessageScalarFieldEnum | AgentMessageScalarFieldEnum[]
  }

  /**
   * AgentMessage findMany
   */
  export type AgentMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
    /**
     * Filter, which AgentMessages to fetch.
     */
    where?: AgentMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AgentMessages to fetch.
     */
    orderBy?: AgentMessageOrderByWithRelationInput | AgentMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AgentMessages.
     */
    cursor?: AgentMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AgentMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AgentMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AgentMessages.
     */
    distinct?: AgentMessageScalarFieldEnum | AgentMessageScalarFieldEnum[]
  }

  /**
   * AgentMessage create
   */
  export type AgentMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a AgentMessage.
     */
    data: XOR<AgentMessageCreateInput, AgentMessageUncheckedCreateInput>
  }

  /**
   * AgentMessage createMany
   */
  export type AgentMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AgentMessages.
     */
    data: AgentMessageCreateManyInput | AgentMessageCreateManyInput[]
  }

  /**
   * AgentMessage createManyAndReturn
   */
  export type AgentMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * The data used to create many AgentMessages.
     */
    data: AgentMessageCreateManyInput | AgentMessageCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * AgentMessage update
   */
  export type AgentMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a AgentMessage.
     */
    data: XOR<AgentMessageUpdateInput, AgentMessageUncheckedUpdateInput>
    /**
     * Choose, which AgentMessage to update.
     */
    where: AgentMessageWhereUniqueInput
  }

  /**
   * AgentMessage updateMany
   */
  export type AgentMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AgentMessages.
     */
    data: XOR<AgentMessageUpdateManyMutationInput, AgentMessageUncheckedUpdateManyInput>
    /**
     * Filter which AgentMessages to update
     */
    where?: AgentMessageWhereInput
    /**
     * Limit how many AgentMessages to update.
     */
    limit?: number
  }

  /**
   * AgentMessage updateManyAndReturn
   */
  export type AgentMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * The data used to update AgentMessages.
     */
    data: XOR<AgentMessageUpdateManyMutationInput, AgentMessageUncheckedUpdateManyInput>
    /**
     * Filter which AgentMessages to update
     */
    where?: AgentMessageWhereInput
    /**
     * Limit how many AgentMessages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * AgentMessage upsert
   */
  export type AgentMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the AgentMessage to update in case it exists.
     */
    where: AgentMessageWhereUniqueInput
    /**
     * In case the AgentMessage found by the `where` argument doesn't exist, create a new AgentMessage with this data.
     */
    create: XOR<AgentMessageCreateInput, AgentMessageUncheckedCreateInput>
    /**
     * In case the AgentMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AgentMessageUpdateInput, AgentMessageUncheckedUpdateInput>
  }

  /**
   * AgentMessage delete
   */
  export type AgentMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
    /**
     * Filter which AgentMessage to delete.
     */
    where: AgentMessageWhereUniqueInput
  }

  /**
   * AgentMessage deleteMany
   */
  export type AgentMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AgentMessages to delete
     */
    where?: AgentMessageWhereInput
    /**
     * Limit how many AgentMessages to delete.
     */
    limit?: number
  }

  /**
   * AgentMessage without action
   */
  export type AgentMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AgentMessage
     */
    select?: AgentMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AgentMessage
     */
    omit?: AgentMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AgentMessageInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const LogScalarFieldEnum: {
    id: 'id',
    occurredAt: 'occurredAt',
    appName: 'appName',
    appBundleId: 'appBundleId',
    isSend: 'isSend',
    isWechat: 'isWechat',
    screenshotPath: 'screenshotPath',
    createdAt: 'createdAt'
  };

  export type LogScalarFieldEnum = (typeof LogScalarFieldEnum)[keyof typeof LogScalarFieldEnum]


  export const PersonScalarFieldEnum: {
    id: 'id',
    name: 'name',
    clientApp: 'clientApp',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PersonScalarFieldEnum = (typeof PersonScalarFieldEnum)[keyof typeof PersonScalarFieldEnum]


  export const ChatTurnScalarFieldEnum: {
    id: 'id',
    logId: 'logId',
    personId: 'personId',
    topic: 'topic',
    capturedAt: 'capturedAt',
    rawAiResponse: 'rawAiResponse',
    createdAt: 'createdAt'
  };

  export type ChatTurnScalarFieldEnum = (typeof ChatTurnScalarFieldEnum)[keyof typeof ChatTurnScalarFieldEnum]


  export const ChatMessageScalarFieldEnum: {
    id: 'id',
    turnId: 'turnId',
    role: 'role',
    senderName: 'senderName',
    senderNormalized: 'senderNormalized',
    content: 'content',
    contentType: 'contentType',
    quoteText: 'quoteText',
    quoteSenderName: 'quoteSenderName',
    quoteRole: 'quoteRole',
    quoteContentType: 'quoteContentType',
    isQuoted: 'isQuoted',
    isRevoked: 'isRevoked',
    messageKey: 'messageKey',
    rawExtracted: 'rawExtracted',
    seq: 'seq',
    createdAt: 'createdAt'
  };

  export type ChatMessageScalarFieldEnum = (typeof ChatMessageScalarFieldEnum)[keyof typeof ChatMessageScalarFieldEnum]


  export const TaskScalarFieldEnum: {
    id: 'id',
    personId: 'personId',
    logId: 'logId',
    sourceTurnId: 'sourceTurnId',
    title: 'title',
    description: 'description',
    dueAt: 'dueAt',
    status: 'status',
    fingerprint: 'fingerprint',
    evidence: 'evidence',
    rawAiResponse: 'rawAiResponse',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    completedAt: 'completedAt'
  };

  export type TaskScalarFieldEnum = (typeof TaskScalarFieldEnum)[keyof typeof TaskScalarFieldEnum]


  export const AgentSessionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    title: 'title',
    screenContext: 'screenContext',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AgentSessionScalarFieldEnum = (typeof AgentSessionScalarFieldEnum)[keyof typeof AgentSessionScalarFieldEnum]


  export const AgentMessageScalarFieldEnum: {
    id: 'id',
    sessionId: 'sessionId',
    role: 'role',
    kind: 'kind',
    content: 'content',
    toolName: 'toolName',
    toolInput: 'toolInput',
    toolResult: 'toolResult',
    isError: 'isError',
    seq: 'seq',
    createdAt: 'createdAt'
  };

  export type AgentMessageScalarFieldEnum = (typeof AgentMessageScalarFieldEnum)[keyof typeof AgentMessageScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type LogWhereInput = {
    AND?: LogWhereInput | LogWhereInput[]
    OR?: LogWhereInput[]
    NOT?: LogWhereInput | LogWhereInput[]
    id?: StringFilter<"Log"> | string
    occurredAt?: DateTimeFilter<"Log"> | Date | string
    appName?: StringFilter<"Log"> | string
    appBundleId?: StringFilter<"Log"> | string
    isSend?: BoolFilter<"Log"> | boolean
    isWechat?: BoolFilter<"Log"> | boolean
    screenshotPath?: StringNullableFilter<"Log"> | string | null
    createdAt?: DateTimeFilter<"Log"> | Date | string
    chatTurns?: ChatTurnListRelationFilter
    tasks?: TaskListRelationFilter
  }

  export type LogOrderByWithRelationInput = {
    id?: SortOrder
    occurredAt?: SortOrder
    appName?: SortOrder
    appBundleId?: SortOrder
    isSend?: SortOrder
    isWechat?: SortOrder
    screenshotPath?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    chatTurns?: ChatTurnOrderByRelationAggregateInput
    tasks?: TaskOrderByRelationAggregateInput
  }

  export type LogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LogWhereInput | LogWhereInput[]
    OR?: LogWhereInput[]
    NOT?: LogWhereInput | LogWhereInput[]
    occurredAt?: DateTimeFilter<"Log"> | Date | string
    appName?: StringFilter<"Log"> | string
    appBundleId?: StringFilter<"Log"> | string
    isSend?: BoolFilter<"Log"> | boolean
    isWechat?: BoolFilter<"Log"> | boolean
    screenshotPath?: StringNullableFilter<"Log"> | string | null
    createdAt?: DateTimeFilter<"Log"> | Date | string
    chatTurns?: ChatTurnListRelationFilter
    tasks?: TaskListRelationFilter
  }, "id">

  export type LogOrderByWithAggregationInput = {
    id?: SortOrder
    occurredAt?: SortOrder
    appName?: SortOrder
    appBundleId?: SortOrder
    isSend?: SortOrder
    isWechat?: SortOrder
    screenshotPath?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: LogCountOrderByAggregateInput
    _max?: LogMaxOrderByAggregateInput
    _min?: LogMinOrderByAggregateInput
  }

  export type LogScalarWhereWithAggregatesInput = {
    AND?: LogScalarWhereWithAggregatesInput | LogScalarWhereWithAggregatesInput[]
    OR?: LogScalarWhereWithAggregatesInput[]
    NOT?: LogScalarWhereWithAggregatesInput | LogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Log"> | string
    occurredAt?: DateTimeWithAggregatesFilter<"Log"> | Date | string
    appName?: StringWithAggregatesFilter<"Log"> | string
    appBundleId?: StringWithAggregatesFilter<"Log"> | string
    isSend?: BoolWithAggregatesFilter<"Log"> | boolean
    isWechat?: BoolWithAggregatesFilter<"Log"> | boolean
    screenshotPath?: StringNullableWithAggregatesFilter<"Log"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Log"> | Date | string
  }

  export type PersonWhereInput = {
    AND?: PersonWhereInput | PersonWhereInput[]
    OR?: PersonWhereInput[]
    NOT?: PersonWhereInput | PersonWhereInput[]
    id?: StringFilter<"Person"> | string
    name?: StringFilter<"Person"> | string
    clientApp?: StringFilter<"Person"> | string
    createdAt?: DateTimeFilter<"Person"> | Date | string
    updatedAt?: DateTimeFilter<"Person"> | Date | string
    chatTurns?: ChatTurnListRelationFilter
    tasks?: TaskListRelationFilter
  }

  export type PersonOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    clientApp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    chatTurns?: ChatTurnOrderByRelationAggregateInput
    tasks?: TaskOrderByRelationAggregateInput
  }

  export type PersonWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name_clientApp?: PersonNameClientAppCompoundUniqueInput
    AND?: PersonWhereInput | PersonWhereInput[]
    OR?: PersonWhereInput[]
    NOT?: PersonWhereInput | PersonWhereInput[]
    name?: StringFilter<"Person"> | string
    clientApp?: StringFilter<"Person"> | string
    createdAt?: DateTimeFilter<"Person"> | Date | string
    updatedAt?: DateTimeFilter<"Person"> | Date | string
    chatTurns?: ChatTurnListRelationFilter
    tasks?: TaskListRelationFilter
  }, "id" | "name_clientApp">

  export type PersonOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    clientApp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PersonCountOrderByAggregateInput
    _max?: PersonMaxOrderByAggregateInput
    _min?: PersonMinOrderByAggregateInput
  }

  export type PersonScalarWhereWithAggregatesInput = {
    AND?: PersonScalarWhereWithAggregatesInput | PersonScalarWhereWithAggregatesInput[]
    OR?: PersonScalarWhereWithAggregatesInput[]
    NOT?: PersonScalarWhereWithAggregatesInput | PersonScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Person"> | string
    name?: StringWithAggregatesFilter<"Person"> | string
    clientApp?: StringWithAggregatesFilter<"Person"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Person"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Person"> | Date | string
  }

  export type ChatTurnWhereInput = {
    AND?: ChatTurnWhereInput | ChatTurnWhereInput[]
    OR?: ChatTurnWhereInput[]
    NOT?: ChatTurnWhereInput | ChatTurnWhereInput[]
    id?: StringFilter<"ChatTurn"> | string
    logId?: StringFilter<"ChatTurn"> | string
    personId?: StringFilter<"ChatTurn"> | string
    topic?: StringFilter<"ChatTurn"> | string
    capturedAt?: DateTimeFilter<"ChatTurn"> | Date | string
    rawAiResponse?: JsonNullableFilter<"ChatTurn">
    createdAt?: DateTimeFilter<"ChatTurn"> | Date | string
    log?: XOR<LogScalarRelationFilter, LogWhereInput>
    person?: XOR<PersonScalarRelationFilter, PersonWhereInput>
    messages?: ChatMessageListRelationFilter
    tasks?: TaskListRelationFilter
  }

  export type ChatTurnOrderByWithRelationInput = {
    id?: SortOrder
    logId?: SortOrder
    personId?: SortOrder
    topic?: SortOrder
    capturedAt?: SortOrder
    rawAiResponse?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    log?: LogOrderByWithRelationInput
    person?: PersonOrderByWithRelationInput
    messages?: ChatMessageOrderByRelationAggregateInput
    tasks?: TaskOrderByRelationAggregateInput
  }

  export type ChatTurnWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ChatTurnWhereInput | ChatTurnWhereInput[]
    OR?: ChatTurnWhereInput[]
    NOT?: ChatTurnWhereInput | ChatTurnWhereInput[]
    logId?: StringFilter<"ChatTurn"> | string
    personId?: StringFilter<"ChatTurn"> | string
    topic?: StringFilter<"ChatTurn"> | string
    capturedAt?: DateTimeFilter<"ChatTurn"> | Date | string
    rawAiResponse?: JsonNullableFilter<"ChatTurn">
    createdAt?: DateTimeFilter<"ChatTurn"> | Date | string
    log?: XOR<LogScalarRelationFilter, LogWhereInput>
    person?: XOR<PersonScalarRelationFilter, PersonWhereInput>
    messages?: ChatMessageListRelationFilter
    tasks?: TaskListRelationFilter
  }, "id">

  export type ChatTurnOrderByWithAggregationInput = {
    id?: SortOrder
    logId?: SortOrder
    personId?: SortOrder
    topic?: SortOrder
    capturedAt?: SortOrder
    rawAiResponse?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ChatTurnCountOrderByAggregateInput
    _max?: ChatTurnMaxOrderByAggregateInput
    _min?: ChatTurnMinOrderByAggregateInput
  }

  export type ChatTurnScalarWhereWithAggregatesInput = {
    AND?: ChatTurnScalarWhereWithAggregatesInput | ChatTurnScalarWhereWithAggregatesInput[]
    OR?: ChatTurnScalarWhereWithAggregatesInput[]
    NOT?: ChatTurnScalarWhereWithAggregatesInput | ChatTurnScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ChatTurn"> | string
    logId?: StringWithAggregatesFilter<"ChatTurn"> | string
    personId?: StringWithAggregatesFilter<"ChatTurn"> | string
    topic?: StringWithAggregatesFilter<"ChatTurn"> | string
    capturedAt?: DateTimeWithAggregatesFilter<"ChatTurn"> | Date | string
    rawAiResponse?: JsonNullableWithAggregatesFilter<"ChatTurn">
    createdAt?: DateTimeWithAggregatesFilter<"ChatTurn"> | Date | string
  }

  export type ChatMessageWhereInput = {
    AND?: ChatMessageWhereInput | ChatMessageWhereInput[]
    OR?: ChatMessageWhereInput[]
    NOT?: ChatMessageWhereInput | ChatMessageWhereInput[]
    id?: StringFilter<"ChatMessage"> | string
    turnId?: StringFilter<"ChatMessage"> | string
    role?: StringFilter<"ChatMessage"> | string
    senderName?: StringNullableFilter<"ChatMessage"> | string | null
    senderNormalized?: StringNullableFilter<"ChatMessage"> | string | null
    content?: StringFilter<"ChatMessage"> | string
    contentType?: StringFilter<"ChatMessage"> | string
    quoteText?: StringNullableFilter<"ChatMessage"> | string | null
    quoteSenderName?: StringNullableFilter<"ChatMessage"> | string | null
    quoteRole?: StringNullableFilter<"ChatMessage"> | string | null
    quoteContentType?: StringNullableFilter<"ChatMessage"> | string | null
    isQuoted?: BoolFilter<"ChatMessage"> | boolean
    isRevoked?: BoolFilter<"ChatMessage"> | boolean
    messageKey?: StringFilter<"ChatMessage"> | string
    rawExtracted?: JsonNullableFilter<"ChatMessage">
    seq?: IntFilter<"ChatMessage"> | number
    createdAt?: DateTimeFilter<"ChatMessage"> | Date | string
    turn?: XOR<ChatTurnScalarRelationFilter, ChatTurnWhereInput>
  }

  export type ChatMessageOrderByWithRelationInput = {
    id?: SortOrder
    turnId?: SortOrder
    role?: SortOrder
    senderName?: SortOrderInput | SortOrder
    senderNormalized?: SortOrderInput | SortOrder
    content?: SortOrder
    contentType?: SortOrder
    quoteText?: SortOrderInput | SortOrder
    quoteSenderName?: SortOrderInput | SortOrder
    quoteRole?: SortOrderInput | SortOrder
    quoteContentType?: SortOrderInput | SortOrder
    isQuoted?: SortOrder
    isRevoked?: SortOrder
    messageKey?: SortOrder
    rawExtracted?: SortOrderInput | SortOrder
    seq?: SortOrder
    createdAt?: SortOrder
    turn?: ChatTurnOrderByWithRelationInput
  }

  export type ChatMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ChatMessageWhereInput | ChatMessageWhereInput[]
    OR?: ChatMessageWhereInput[]
    NOT?: ChatMessageWhereInput | ChatMessageWhereInput[]
    turnId?: StringFilter<"ChatMessage"> | string
    role?: StringFilter<"ChatMessage"> | string
    senderName?: StringNullableFilter<"ChatMessage"> | string | null
    senderNormalized?: StringNullableFilter<"ChatMessage"> | string | null
    content?: StringFilter<"ChatMessage"> | string
    contentType?: StringFilter<"ChatMessage"> | string
    quoteText?: StringNullableFilter<"ChatMessage"> | string | null
    quoteSenderName?: StringNullableFilter<"ChatMessage"> | string | null
    quoteRole?: StringNullableFilter<"ChatMessage"> | string | null
    quoteContentType?: StringNullableFilter<"ChatMessage"> | string | null
    isQuoted?: BoolFilter<"ChatMessage"> | boolean
    isRevoked?: BoolFilter<"ChatMessage"> | boolean
    messageKey?: StringFilter<"ChatMessage"> | string
    rawExtracted?: JsonNullableFilter<"ChatMessage">
    seq?: IntFilter<"ChatMessage"> | number
    createdAt?: DateTimeFilter<"ChatMessage"> | Date | string
    turn?: XOR<ChatTurnScalarRelationFilter, ChatTurnWhereInput>
  }, "id">

  export type ChatMessageOrderByWithAggregationInput = {
    id?: SortOrder
    turnId?: SortOrder
    role?: SortOrder
    senderName?: SortOrderInput | SortOrder
    senderNormalized?: SortOrderInput | SortOrder
    content?: SortOrder
    contentType?: SortOrder
    quoteText?: SortOrderInput | SortOrder
    quoteSenderName?: SortOrderInput | SortOrder
    quoteRole?: SortOrderInput | SortOrder
    quoteContentType?: SortOrderInput | SortOrder
    isQuoted?: SortOrder
    isRevoked?: SortOrder
    messageKey?: SortOrder
    rawExtracted?: SortOrderInput | SortOrder
    seq?: SortOrder
    createdAt?: SortOrder
    _count?: ChatMessageCountOrderByAggregateInput
    _avg?: ChatMessageAvgOrderByAggregateInput
    _max?: ChatMessageMaxOrderByAggregateInput
    _min?: ChatMessageMinOrderByAggregateInput
    _sum?: ChatMessageSumOrderByAggregateInput
  }

  export type ChatMessageScalarWhereWithAggregatesInput = {
    AND?: ChatMessageScalarWhereWithAggregatesInput | ChatMessageScalarWhereWithAggregatesInput[]
    OR?: ChatMessageScalarWhereWithAggregatesInput[]
    NOT?: ChatMessageScalarWhereWithAggregatesInput | ChatMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ChatMessage"> | string
    turnId?: StringWithAggregatesFilter<"ChatMessage"> | string
    role?: StringWithAggregatesFilter<"ChatMessage"> | string
    senderName?: StringNullableWithAggregatesFilter<"ChatMessage"> | string | null
    senderNormalized?: StringNullableWithAggregatesFilter<"ChatMessage"> | string | null
    content?: StringWithAggregatesFilter<"ChatMessage"> | string
    contentType?: StringWithAggregatesFilter<"ChatMessage"> | string
    quoteText?: StringNullableWithAggregatesFilter<"ChatMessage"> | string | null
    quoteSenderName?: StringNullableWithAggregatesFilter<"ChatMessage"> | string | null
    quoteRole?: StringNullableWithAggregatesFilter<"ChatMessage"> | string | null
    quoteContentType?: StringNullableWithAggregatesFilter<"ChatMessage"> | string | null
    isQuoted?: BoolWithAggregatesFilter<"ChatMessage"> | boolean
    isRevoked?: BoolWithAggregatesFilter<"ChatMessage"> | boolean
    messageKey?: StringWithAggregatesFilter<"ChatMessage"> | string
    rawExtracted?: JsonNullableWithAggregatesFilter<"ChatMessage">
    seq?: IntWithAggregatesFilter<"ChatMessage"> | number
    createdAt?: DateTimeWithAggregatesFilter<"ChatMessage"> | Date | string
  }

  export type TaskWhereInput = {
    AND?: TaskWhereInput | TaskWhereInput[]
    OR?: TaskWhereInput[]
    NOT?: TaskWhereInput | TaskWhereInput[]
    id?: StringFilter<"Task"> | string
    personId?: StringNullableFilter<"Task"> | string | null
    logId?: StringNullableFilter<"Task"> | string | null
    sourceTurnId?: StringNullableFilter<"Task"> | string | null
    title?: StringFilter<"Task"> | string
    description?: StringFilter<"Task"> | string
    dueAt?: DateTimeNullableFilter<"Task"> | Date | string | null
    status?: StringFilter<"Task"> | string
    fingerprint?: StringFilter<"Task"> | string
    evidence?: StringFilter<"Task"> | string
    rawAiResponse?: JsonNullableFilter<"Task">
    createdAt?: DateTimeFilter<"Task"> | Date | string
    updatedAt?: DateTimeFilter<"Task"> | Date | string
    completedAt?: DateTimeNullableFilter<"Task"> | Date | string | null
    person?: XOR<PersonNullableScalarRelationFilter, PersonWhereInput> | null
    log?: XOR<LogNullableScalarRelationFilter, LogWhereInput> | null
    sourceTurn?: XOR<ChatTurnNullableScalarRelationFilter, ChatTurnWhereInput> | null
  }

  export type TaskOrderByWithRelationInput = {
    id?: SortOrder
    personId?: SortOrderInput | SortOrder
    logId?: SortOrderInput | SortOrder
    sourceTurnId?: SortOrderInput | SortOrder
    title?: SortOrder
    description?: SortOrder
    dueAt?: SortOrderInput | SortOrder
    status?: SortOrder
    fingerprint?: SortOrder
    evidence?: SortOrder
    rawAiResponse?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    person?: PersonOrderByWithRelationInput
    log?: LogOrderByWithRelationInput
    sourceTurn?: ChatTurnOrderByWithRelationInput
  }

  export type TaskWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    fingerprint?: string
    AND?: TaskWhereInput | TaskWhereInput[]
    OR?: TaskWhereInput[]
    NOT?: TaskWhereInput | TaskWhereInput[]
    personId?: StringNullableFilter<"Task"> | string | null
    logId?: StringNullableFilter<"Task"> | string | null
    sourceTurnId?: StringNullableFilter<"Task"> | string | null
    title?: StringFilter<"Task"> | string
    description?: StringFilter<"Task"> | string
    dueAt?: DateTimeNullableFilter<"Task"> | Date | string | null
    status?: StringFilter<"Task"> | string
    evidence?: StringFilter<"Task"> | string
    rawAiResponse?: JsonNullableFilter<"Task">
    createdAt?: DateTimeFilter<"Task"> | Date | string
    updatedAt?: DateTimeFilter<"Task"> | Date | string
    completedAt?: DateTimeNullableFilter<"Task"> | Date | string | null
    person?: XOR<PersonNullableScalarRelationFilter, PersonWhereInput> | null
    log?: XOR<LogNullableScalarRelationFilter, LogWhereInput> | null
    sourceTurn?: XOR<ChatTurnNullableScalarRelationFilter, ChatTurnWhereInput> | null
  }, "id" | "fingerprint">

  export type TaskOrderByWithAggregationInput = {
    id?: SortOrder
    personId?: SortOrderInput | SortOrder
    logId?: SortOrderInput | SortOrder
    sourceTurnId?: SortOrderInput | SortOrder
    title?: SortOrder
    description?: SortOrder
    dueAt?: SortOrderInput | SortOrder
    status?: SortOrder
    fingerprint?: SortOrder
    evidence?: SortOrder
    rawAiResponse?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrderInput | SortOrder
    _count?: TaskCountOrderByAggregateInput
    _max?: TaskMaxOrderByAggregateInput
    _min?: TaskMinOrderByAggregateInput
  }

  export type TaskScalarWhereWithAggregatesInput = {
    AND?: TaskScalarWhereWithAggregatesInput | TaskScalarWhereWithAggregatesInput[]
    OR?: TaskScalarWhereWithAggregatesInput[]
    NOT?: TaskScalarWhereWithAggregatesInput | TaskScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Task"> | string
    personId?: StringNullableWithAggregatesFilter<"Task"> | string | null
    logId?: StringNullableWithAggregatesFilter<"Task"> | string | null
    sourceTurnId?: StringNullableWithAggregatesFilter<"Task"> | string | null
    title?: StringWithAggregatesFilter<"Task"> | string
    description?: StringWithAggregatesFilter<"Task"> | string
    dueAt?: DateTimeNullableWithAggregatesFilter<"Task"> | Date | string | null
    status?: StringWithAggregatesFilter<"Task"> | string
    fingerprint?: StringWithAggregatesFilter<"Task"> | string
    evidence?: StringWithAggregatesFilter<"Task"> | string
    rawAiResponse?: JsonNullableWithAggregatesFilter<"Task">
    createdAt?: DateTimeWithAggregatesFilter<"Task"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Task"> | Date | string
    completedAt?: DateTimeNullableWithAggregatesFilter<"Task"> | Date | string | null
  }

  export type AgentSessionWhereInput = {
    AND?: AgentSessionWhereInput | AgentSessionWhereInput[]
    OR?: AgentSessionWhereInput[]
    NOT?: AgentSessionWhereInput | AgentSessionWhereInput[]
    id?: StringFilter<"AgentSession"> | string
    userId?: StringFilter<"AgentSession"> | string
    title?: StringFilter<"AgentSession"> | string
    screenContext?: JsonNullableFilter<"AgentSession">
    createdAt?: DateTimeFilter<"AgentSession"> | Date | string
    updatedAt?: DateTimeFilter<"AgentSession"> | Date | string
    messages?: AgentMessageListRelationFilter
  }

  export type AgentSessionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    screenContext?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    messages?: AgentMessageOrderByRelationAggregateInput
  }

  export type AgentSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AgentSessionWhereInput | AgentSessionWhereInput[]
    OR?: AgentSessionWhereInput[]
    NOT?: AgentSessionWhereInput | AgentSessionWhereInput[]
    userId?: StringFilter<"AgentSession"> | string
    title?: StringFilter<"AgentSession"> | string
    screenContext?: JsonNullableFilter<"AgentSession">
    createdAt?: DateTimeFilter<"AgentSession"> | Date | string
    updatedAt?: DateTimeFilter<"AgentSession"> | Date | string
    messages?: AgentMessageListRelationFilter
  }, "id">

  export type AgentSessionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    screenContext?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AgentSessionCountOrderByAggregateInput
    _max?: AgentSessionMaxOrderByAggregateInput
    _min?: AgentSessionMinOrderByAggregateInput
  }

  export type AgentSessionScalarWhereWithAggregatesInput = {
    AND?: AgentSessionScalarWhereWithAggregatesInput | AgentSessionScalarWhereWithAggregatesInput[]
    OR?: AgentSessionScalarWhereWithAggregatesInput[]
    NOT?: AgentSessionScalarWhereWithAggregatesInput | AgentSessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AgentSession"> | string
    userId?: StringWithAggregatesFilter<"AgentSession"> | string
    title?: StringWithAggregatesFilter<"AgentSession"> | string
    screenContext?: JsonNullableWithAggregatesFilter<"AgentSession">
    createdAt?: DateTimeWithAggregatesFilter<"AgentSession"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"AgentSession"> | Date | string
  }

  export type AgentMessageWhereInput = {
    AND?: AgentMessageWhereInput | AgentMessageWhereInput[]
    OR?: AgentMessageWhereInput[]
    NOT?: AgentMessageWhereInput | AgentMessageWhereInput[]
    id?: StringFilter<"AgentMessage"> | string
    sessionId?: StringFilter<"AgentMessage"> | string
    role?: StringFilter<"AgentMessage"> | string
    kind?: StringFilter<"AgentMessage"> | string
    content?: StringFilter<"AgentMessage"> | string
    toolName?: StringNullableFilter<"AgentMessage"> | string | null
    toolInput?: JsonNullableFilter<"AgentMessage">
    toolResult?: JsonNullableFilter<"AgentMessage">
    isError?: BoolFilter<"AgentMessage"> | boolean
    seq?: IntFilter<"AgentMessage"> | number
    createdAt?: DateTimeFilter<"AgentMessage"> | Date | string
    session?: XOR<AgentSessionScalarRelationFilter, AgentSessionWhereInput>
  }

  export type AgentMessageOrderByWithRelationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    role?: SortOrder
    kind?: SortOrder
    content?: SortOrder
    toolName?: SortOrderInput | SortOrder
    toolInput?: SortOrderInput | SortOrder
    toolResult?: SortOrderInput | SortOrder
    isError?: SortOrder
    seq?: SortOrder
    createdAt?: SortOrder
    session?: AgentSessionOrderByWithRelationInput
  }

  export type AgentMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AgentMessageWhereInput | AgentMessageWhereInput[]
    OR?: AgentMessageWhereInput[]
    NOT?: AgentMessageWhereInput | AgentMessageWhereInput[]
    sessionId?: StringFilter<"AgentMessage"> | string
    role?: StringFilter<"AgentMessage"> | string
    kind?: StringFilter<"AgentMessage"> | string
    content?: StringFilter<"AgentMessage"> | string
    toolName?: StringNullableFilter<"AgentMessage"> | string | null
    toolInput?: JsonNullableFilter<"AgentMessage">
    toolResult?: JsonNullableFilter<"AgentMessage">
    isError?: BoolFilter<"AgentMessage"> | boolean
    seq?: IntFilter<"AgentMessage"> | number
    createdAt?: DateTimeFilter<"AgentMessage"> | Date | string
    session?: XOR<AgentSessionScalarRelationFilter, AgentSessionWhereInput>
  }, "id">

  export type AgentMessageOrderByWithAggregationInput = {
    id?: SortOrder
    sessionId?: SortOrder
    role?: SortOrder
    kind?: SortOrder
    content?: SortOrder
    toolName?: SortOrderInput | SortOrder
    toolInput?: SortOrderInput | SortOrder
    toolResult?: SortOrderInput | SortOrder
    isError?: SortOrder
    seq?: SortOrder
    createdAt?: SortOrder
    _count?: AgentMessageCountOrderByAggregateInput
    _avg?: AgentMessageAvgOrderByAggregateInput
    _max?: AgentMessageMaxOrderByAggregateInput
    _min?: AgentMessageMinOrderByAggregateInput
    _sum?: AgentMessageSumOrderByAggregateInput
  }

  export type AgentMessageScalarWhereWithAggregatesInput = {
    AND?: AgentMessageScalarWhereWithAggregatesInput | AgentMessageScalarWhereWithAggregatesInput[]
    OR?: AgentMessageScalarWhereWithAggregatesInput[]
    NOT?: AgentMessageScalarWhereWithAggregatesInput | AgentMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AgentMessage"> | string
    sessionId?: StringWithAggregatesFilter<"AgentMessage"> | string
    role?: StringWithAggregatesFilter<"AgentMessage"> | string
    kind?: StringWithAggregatesFilter<"AgentMessage"> | string
    content?: StringWithAggregatesFilter<"AgentMessage"> | string
    toolName?: StringNullableWithAggregatesFilter<"AgentMessage"> | string | null
    toolInput?: JsonNullableWithAggregatesFilter<"AgentMessage">
    toolResult?: JsonNullableWithAggregatesFilter<"AgentMessage">
    isError?: BoolWithAggregatesFilter<"AgentMessage"> | boolean
    seq?: IntWithAggregatesFilter<"AgentMessage"> | number
    createdAt?: DateTimeWithAggregatesFilter<"AgentMessage"> | Date | string
  }

  export type LogCreateInput = {
    id: string
    occurredAt: Date | string
    appName: string
    appBundleId?: string
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: string | null
    createdAt?: Date | string
    chatTurns?: ChatTurnCreateNestedManyWithoutLogInput
    tasks?: TaskCreateNestedManyWithoutLogInput
  }

  export type LogUncheckedCreateInput = {
    id: string
    occurredAt: Date | string
    appName: string
    appBundleId?: string
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: string | null
    createdAt?: Date | string
    chatTurns?: ChatTurnUncheckedCreateNestedManyWithoutLogInput
    tasks?: TaskUncheckedCreateNestedManyWithoutLogInput
  }

  export type LogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    appBundleId?: StringFieldUpdateOperationsInput | string
    isSend?: BoolFieldUpdateOperationsInput | boolean
    isWechat?: BoolFieldUpdateOperationsInput | boolean
    screenshotPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chatTurns?: ChatTurnUpdateManyWithoutLogNestedInput
    tasks?: TaskUpdateManyWithoutLogNestedInput
  }

  export type LogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    appBundleId?: StringFieldUpdateOperationsInput | string
    isSend?: BoolFieldUpdateOperationsInput | boolean
    isWechat?: BoolFieldUpdateOperationsInput | boolean
    screenshotPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chatTurns?: ChatTurnUncheckedUpdateManyWithoutLogNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutLogNestedInput
  }

  export type LogCreateManyInput = {
    id: string
    occurredAt: Date | string
    appName: string
    appBundleId?: string
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: string | null
    createdAt?: Date | string
  }

  export type LogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    appBundleId?: StringFieldUpdateOperationsInput | string
    isSend?: BoolFieldUpdateOperationsInput | boolean
    isWechat?: BoolFieldUpdateOperationsInput | boolean
    screenshotPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    appBundleId?: StringFieldUpdateOperationsInput | string
    isSend?: BoolFieldUpdateOperationsInput | boolean
    isWechat?: BoolFieldUpdateOperationsInput | boolean
    screenshotPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PersonCreateInput = {
    id: string
    name: string
    clientApp?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    chatTurns?: ChatTurnCreateNestedManyWithoutPersonInput
    tasks?: TaskCreateNestedManyWithoutPersonInput
  }

  export type PersonUncheckedCreateInput = {
    id: string
    name: string
    clientApp?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    chatTurns?: ChatTurnUncheckedCreateNestedManyWithoutPersonInput
    tasks?: TaskUncheckedCreateNestedManyWithoutPersonInput
  }

  export type PersonUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    clientApp?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chatTurns?: ChatTurnUpdateManyWithoutPersonNestedInput
    tasks?: TaskUpdateManyWithoutPersonNestedInput
  }

  export type PersonUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    clientApp?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chatTurns?: ChatTurnUncheckedUpdateManyWithoutPersonNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutPersonNestedInput
  }

  export type PersonCreateManyInput = {
    id: string
    name: string
    clientApp?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PersonUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    clientApp?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PersonUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    clientApp?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatTurnCreateInput = {
    id: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    log: LogCreateNestedOneWithoutChatTurnsInput
    person: PersonCreateNestedOneWithoutChatTurnsInput
    messages?: ChatMessageCreateNestedManyWithoutTurnInput
    tasks?: TaskCreateNestedManyWithoutSourceTurnInput
  }

  export type ChatTurnUncheckedCreateInput = {
    id: string
    logId: string
    personId: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    messages?: ChatMessageUncheckedCreateNestedManyWithoutTurnInput
    tasks?: TaskUncheckedCreateNestedManyWithoutSourceTurnInput
  }

  export type ChatTurnUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    log?: LogUpdateOneRequiredWithoutChatTurnsNestedInput
    person?: PersonUpdateOneRequiredWithoutChatTurnsNestedInput
    messages?: ChatMessageUpdateManyWithoutTurnNestedInput
    tasks?: TaskUpdateManyWithoutSourceTurnNestedInput
  }

  export type ChatTurnUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    logId?: StringFieldUpdateOperationsInput | string
    personId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: ChatMessageUncheckedUpdateManyWithoutTurnNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutSourceTurnNestedInput
  }

  export type ChatTurnCreateManyInput = {
    id: string
    logId: string
    personId: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ChatTurnUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatTurnUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    logId?: StringFieldUpdateOperationsInput | string
    personId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageCreateInput = {
    id: string
    role: string
    senderName?: string | null
    senderNormalized?: string | null
    content: string
    contentType?: string
    quoteText?: string | null
    quoteSenderName?: string | null
    quoteRole?: string | null
    quoteContentType?: string | null
    isQuoted?: boolean
    isRevoked?: boolean
    messageKey?: string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: number
    createdAt?: Date | string
    turn: ChatTurnCreateNestedOneWithoutMessagesInput
  }

  export type ChatMessageUncheckedCreateInput = {
    id: string
    turnId: string
    role: string
    senderName?: string | null
    senderNormalized?: string | null
    content: string
    contentType?: string
    quoteText?: string | null
    quoteSenderName?: string | null
    quoteRole?: string | null
    quoteContentType?: string | null
    isQuoted?: boolean
    isRevoked?: boolean
    messageKey?: string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: number
    createdAt?: Date | string
  }

  export type ChatMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    contentType?: StringFieldUpdateOperationsInput | string
    quoteText?: NullableStringFieldUpdateOperationsInput | string | null
    quoteSenderName?: NullableStringFieldUpdateOperationsInput | string | null
    quoteRole?: NullableStringFieldUpdateOperationsInput | string | null
    quoteContentType?: NullableStringFieldUpdateOperationsInput | string | null
    isQuoted?: BoolFieldUpdateOperationsInput | boolean
    isRevoked?: BoolFieldUpdateOperationsInput | boolean
    messageKey?: StringFieldUpdateOperationsInput | string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    turn?: ChatTurnUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type ChatMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    turnId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    contentType?: StringFieldUpdateOperationsInput | string
    quoteText?: NullableStringFieldUpdateOperationsInput | string | null
    quoteSenderName?: NullableStringFieldUpdateOperationsInput | string | null
    quoteRole?: NullableStringFieldUpdateOperationsInput | string | null
    quoteContentType?: NullableStringFieldUpdateOperationsInput | string | null
    isQuoted?: BoolFieldUpdateOperationsInput | boolean
    isRevoked?: BoolFieldUpdateOperationsInput | boolean
    messageKey?: StringFieldUpdateOperationsInput | string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageCreateManyInput = {
    id: string
    turnId: string
    role: string
    senderName?: string | null
    senderNormalized?: string | null
    content: string
    contentType?: string
    quoteText?: string | null
    quoteSenderName?: string | null
    quoteRole?: string | null
    quoteContentType?: string | null
    isQuoted?: boolean
    isRevoked?: boolean
    messageKey?: string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: number
    createdAt?: Date | string
  }

  export type ChatMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    contentType?: StringFieldUpdateOperationsInput | string
    quoteText?: NullableStringFieldUpdateOperationsInput | string | null
    quoteSenderName?: NullableStringFieldUpdateOperationsInput | string | null
    quoteRole?: NullableStringFieldUpdateOperationsInput | string | null
    quoteContentType?: NullableStringFieldUpdateOperationsInput | string | null
    isQuoted?: BoolFieldUpdateOperationsInput | boolean
    isRevoked?: BoolFieldUpdateOperationsInput | boolean
    messageKey?: StringFieldUpdateOperationsInput | string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    turnId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    contentType?: StringFieldUpdateOperationsInput | string
    quoteText?: NullableStringFieldUpdateOperationsInput | string | null
    quoteSenderName?: NullableStringFieldUpdateOperationsInput | string | null
    quoteRole?: NullableStringFieldUpdateOperationsInput | string | null
    quoteContentType?: NullableStringFieldUpdateOperationsInput | string | null
    isQuoted?: BoolFieldUpdateOperationsInput | boolean
    isRevoked?: BoolFieldUpdateOperationsInput | boolean
    messageKey?: StringFieldUpdateOperationsInput | string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TaskCreateInput = {
    id: string
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    person?: PersonCreateNestedOneWithoutTasksInput
    log?: LogCreateNestedOneWithoutTasksInput
    sourceTurn?: ChatTurnCreateNestedOneWithoutTasksInput
  }

  export type TaskUncheckedCreateInput = {
    id: string
    personId?: string | null
    logId?: string | null
    sourceTurnId?: string | null
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type TaskUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    person?: PersonUpdateOneWithoutTasksNestedInput
    log?: LogUpdateOneWithoutTasksNestedInput
    sourceTurn?: ChatTurnUpdateOneWithoutTasksNestedInput
  }

  export type TaskUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    personId?: NullableStringFieldUpdateOperationsInput | string | null
    logId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceTurnId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TaskCreateManyInput = {
    id: string
    personId?: string | null
    logId?: string | null
    sourceTurnId?: string | null
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type TaskUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TaskUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    personId?: NullableStringFieldUpdateOperationsInput | string | null
    logId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceTurnId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type AgentSessionCreateInput = {
    id: string
    userId: string
    title?: string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: AgentMessageCreateNestedManyWithoutSessionInput
  }

  export type AgentSessionUncheckedCreateInput = {
    id: string
    userId: string
    title?: string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    messages?: AgentMessageUncheckedCreateNestedManyWithoutSessionInput
  }

  export type AgentSessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: AgentMessageUpdateManyWithoutSessionNestedInput
  }

  export type AgentSessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: AgentMessageUncheckedUpdateManyWithoutSessionNestedInput
  }

  export type AgentSessionCreateManyInput = {
    id: string
    userId: string
    title?: string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentSessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentSessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentMessageCreateInput = {
    id: string
    role: string
    kind: string
    content?: string
    toolName?: string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: boolean
    seq?: number
    createdAt?: Date | string
    session: AgentSessionCreateNestedOneWithoutMessagesInput
  }

  export type AgentMessageUncheckedCreateInput = {
    id: string
    sessionId: string
    role: string
    kind: string
    content?: string
    toolName?: string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: boolean
    seq?: number
    createdAt?: Date | string
  }

  export type AgentMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    toolName?: NullableStringFieldUpdateOperationsInput | string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: BoolFieldUpdateOperationsInput | boolean
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    session?: AgentSessionUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type AgentMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    toolName?: NullableStringFieldUpdateOperationsInput | string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: BoolFieldUpdateOperationsInput | boolean
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentMessageCreateManyInput = {
    id: string
    sessionId: string
    role: string
    kind: string
    content?: string
    toolName?: string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: boolean
    seq?: number
    createdAt?: Date | string
  }

  export type AgentMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    toolName?: NullableStringFieldUpdateOperationsInput | string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: BoolFieldUpdateOperationsInput | boolean
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    toolName?: NullableStringFieldUpdateOperationsInput | string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: BoolFieldUpdateOperationsInput | boolean
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type ChatTurnListRelationFilter = {
    every?: ChatTurnWhereInput
    some?: ChatTurnWhereInput
    none?: ChatTurnWhereInput
  }

  export type TaskListRelationFilter = {
    every?: TaskWhereInput
    some?: TaskWhereInput
    none?: TaskWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ChatTurnOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TaskOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LogCountOrderByAggregateInput = {
    id?: SortOrder
    occurredAt?: SortOrder
    appName?: SortOrder
    appBundleId?: SortOrder
    isSend?: SortOrder
    isWechat?: SortOrder
    screenshotPath?: SortOrder
    createdAt?: SortOrder
  }

  export type LogMaxOrderByAggregateInput = {
    id?: SortOrder
    occurredAt?: SortOrder
    appName?: SortOrder
    appBundleId?: SortOrder
    isSend?: SortOrder
    isWechat?: SortOrder
    screenshotPath?: SortOrder
    createdAt?: SortOrder
  }

  export type LogMinOrderByAggregateInput = {
    id?: SortOrder
    occurredAt?: SortOrder
    appName?: SortOrder
    appBundleId?: SortOrder
    isSend?: SortOrder
    isWechat?: SortOrder
    screenshotPath?: SortOrder
    createdAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type PersonNameClientAppCompoundUniqueInput = {
    name: string
    clientApp: string
  }

  export type PersonCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    clientApp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PersonMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    clientApp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PersonMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    clientApp?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type LogScalarRelationFilter = {
    is?: LogWhereInput
    isNot?: LogWhereInput
  }

  export type PersonScalarRelationFilter = {
    is?: PersonWhereInput
    isNot?: PersonWhereInput
  }

  export type ChatMessageListRelationFilter = {
    every?: ChatMessageWhereInput
    some?: ChatMessageWhereInput
    none?: ChatMessageWhereInput
  }

  export type ChatMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ChatTurnCountOrderByAggregateInput = {
    id?: SortOrder
    logId?: SortOrder
    personId?: SortOrder
    topic?: SortOrder
    capturedAt?: SortOrder
    rawAiResponse?: SortOrder
    createdAt?: SortOrder
  }

  export type ChatTurnMaxOrderByAggregateInput = {
    id?: SortOrder
    logId?: SortOrder
    personId?: SortOrder
    topic?: SortOrder
    capturedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type ChatTurnMinOrderByAggregateInput = {
    id?: SortOrder
    logId?: SortOrder
    personId?: SortOrder
    topic?: SortOrder
    capturedAt?: SortOrder
    createdAt?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type ChatTurnScalarRelationFilter = {
    is?: ChatTurnWhereInput
    isNot?: ChatTurnWhereInput
  }

  export type ChatMessageCountOrderByAggregateInput = {
    id?: SortOrder
    turnId?: SortOrder
    role?: SortOrder
    senderName?: SortOrder
    senderNormalized?: SortOrder
    content?: SortOrder
    contentType?: SortOrder
    quoteText?: SortOrder
    quoteSenderName?: SortOrder
    quoteRole?: SortOrder
    quoteContentType?: SortOrder
    isQuoted?: SortOrder
    isRevoked?: SortOrder
    messageKey?: SortOrder
    rawExtracted?: SortOrder
    seq?: SortOrder
    createdAt?: SortOrder
  }

  export type ChatMessageAvgOrderByAggregateInput = {
    seq?: SortOrder
  }

  export type ChatMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    turnId?: SortOrder
    role?: SortOrder
    senderName?: SortOrder
    senderNormalized?: SortOrder
    content?: SortOrder
    contentType?: SortOrder
    quoteText?: SortOrder
    quoteSenderName?: SortOrder
    quoteRole?: SortOrder
    quoteContentType?: SortOrder
    isQuoted?: SortOrder
    isRevoked?: SortOrder
    messageKey?: SortOrder
    seq?: SortOrder
    createdAt?: SortOrder
  }

  export type ChatMessageMinOrderByAggregateInput = {
    id?: SortOrder
    turnId?: SortOrder
    role?: SortOrder
    senderName?: SortOrder
    senderNormalized?: SortOrder
    content?: SortOrder
    contentType?: SortOrder
    quoteText?: SortOrder
    quoteSenderName?: SortOrder
    quoteRole?: SortOrder
    quoteContentType?: SortOrder
    isQuoted?: SortOrder
    isRevoked?: SortOrder
    messageKey?: SortOrder
    seq?: SortOrder
    createdAt?: SortOrder
  }

  export type ChatMessageSumOrderByAggregateInput = {
    seq?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type PersonNullableScalarRelationFilter = {
    is?: PersonWhereInput | null
    isNot?: PersonWhereInput | null
  }

  export type LogNullableScalarRelationFilter = {
    is?: LogWhereInput | null
    isNot?: LogWhereInput | null
  }

  export type ChatTurnNullableScalarRelationFilter = {
    is?: ChatTurnWhereInput | null
    isNot?: ChatTurnWhereInput | null
  }

  export type TaskCountOrderByAggregateInput = {
    id?: SortOrder
    personId?: SortOrder
    logId?: SortOrder
    sourceTurnId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    dueAt?: SortOrder
    status?: SortOrder
    fingerprint?: SortOrder
    evidence?: SortOrder
    rawAiResponse?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrder
  }

  export type TaskMaxOrderByAggregateInput = {
    id?: SortOrder
    personId?: SortOrder
    logId?: SortOrder
    sourceTurnId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    dueAt?: SortOrder
    status?: SortOrder
    fingerprint?: SortOrder
    evidence?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrder
  }

  export type TaskMinOrderByAggregateInput = {
    id?: SortOrder
    personId?: SortOrder
    logId?: SortOrder
    sourceTurnId?: SortOrder
    title?: SortOrder
    description?: SortOrder
    dueAt?: SortOrder
    status?: SortOrder
    fingerprint?: SortOrder
    evidence?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    completedAt?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type AgentMessageListRelationFilter = {
    every?: AgentMessageWhereInput
    some?: AgentMessageWhereInput
    none?: AgentMessageWhereInput
  }

  export type AgentMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AgentSessionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    screenContext?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentSessionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentSessionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    title?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AgentSessionScalarRelationFilter = {
    is?: AgentSessionWhereInput
    isNot?: AgentSessionWhereInput
  }

  export type AgentMessageCountOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    role?: SortOrder
    kind?: SortOrder
    content?: SortOrder
    toolName?: SortOrder
    toolInput?: SortOrder
    toolResult?: SortOrder
    isError?: SortOrder
    seq?: SortOrder
    createdAt?: SortOrder
  }

  export type AgentMessageAvgOrderByAggregateInput = {
    seq?: SortOrder
  }

  export type AgentMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    role?: SortOrder
    kind?: SortOrder
    content?: SortOrder
    toolName?: SortOrder
    isError?: SortOrder
    seq?: SortOrder
    createdAt?: SortOrder
  }

  export type AgentMessageMinOrderByAggregateInput = {
    id?: SortOrder
    sessionId?: SortOrder
    role?: SortOrder
    kind?: SortOrder
    content?: SortOrder
    toolName?: SortOrder
    isError?: SortOrder
    seq?: SortOrder
    createdAt?: SortOrder
  }

  export type AgentMessageSumOrderByAggregateInput = {
    seq?: SortOrder
  }

  export type ChatTurnCreateNestedManyWithoutLogInput = {
    create?: XOR<ChatTurnCreateWithoutLogInput, ChatTurnUncheckedCreateWithoutLogInput> | ChatTurnCreateWithoutLogInput[] | ChatTurnUncheckedCreateWithoutLogInput[]
    connectOrCreate?: ChatTurnCreateOrConnectWithoutLogInput | ChatTurnCreateOrConnectWithoutLogInput[]
    createMany?: ChatTurnCreateManyLogInputEnvelope
    connect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
  }

  export type TaskCreateNestedManyWithoutLogInput = {
    create?: XOR<TaskCreateWithoutLogInput, TaskUncheckedCreateWithoutLogInput> | TaskCreateWithoutLogInput[] | TaskUncheckedCreateWithoutLogInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutLogInput | TaskCreateOrConnectWithoutLogInput[]
    createMany?: TaskCreateManyLogInputEnvelope
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
  }

  export type ChatTurnUncheckedCreateNestedManyWithoutLogInput = {
    create?: XOR<ChatTurnCreateWithoutLogInput, ChatTurnUncheckedCreateWithoutLogInput> | ChatTurnCreateWithoutLogInput[] | ChatTurnUncheckedCreateWithoutLogInput[]
    connectOrCreate?: ChatTurnCreateOrConnectWithoutLogInput | ChatTurnCreateOrConnectWithoutLogInput[]
    createMany?: ChatTurnCreateManyLogInputEnvelope
    connect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
  }

  export type TaskUncheckedCreateNestedManyWithoutLogInput = {
    create?: XOR<TaskCreateWithoutLogInput, TaskUncheckedCreateWithoutLogInput> | TaskCreateWithoutLogInput[] | TaskUncheckedCreateWithoutLogInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutLogInput | TaskCreateOrConnectWithoutLogInput[]
    createMany?: TaskCreateManyLogInputEnvelope
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type ChatTurnUpdateManyWithoutLogNestedInput = {
    create?: XOR<ChatTurnCreateWithoutLogInput, ChatTurnUncheckedCreateWithoutLogInput> | ChatTurnCreateWithoutLogInput[] | ChatTurnUncheckedCreateWithoutLogInput[]
    connectOrCreate?: ChatTurnCreateOrConnectWithoutLogInput | ChatTurnCreateOrConnectWithoutLogInput[]
    upsert?: ChatTurnUpsertWithWhereUniqueWithoutLogInput | ChatTurnUpsertWithWhereUniqueWithoutLogInput[]
    createMany?: ChatTurnCreateManyLogInputEnvelope
    set?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    disconnect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    delete?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    connect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    update?: ChatTurnUpdateWithWhereUniqueWithoutLogInput | ChatTurnUpdateWithWhereUniqueWithoutLogInput[]
    updateMany?: ChatTurnUpdateManyWithWhereWithoutLogInput | ChatTurnUpdateManyWithWhereWithoutLogInput[]
    deleteMany?: ChatTurnScalarWhereInput | ChatTurnScalarWhereInput[]
  }

  export type TaskUpdateManyWithoutLogNestedInput = {
    create?: XOR<TaskCreateWithoutLogInput, TaskUncheckedCreateWithoutLogInput> | TaskCreateWithoutLogInput[] | TaskUncheckedCreateWithoutLogInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutLogInput | TaskCreateOrConnectWithoutLogInput[]
    upsert?: TaskUpsertWithWhereUniqueWithoutLogInput | TaskUpsertWithWhereUniqueWithoutLogInput[]
    createMany?: TaskCreateManyLogInputEnvelope
    set?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    disconnect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    delete?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    update?: TaskUpdateWithWhereUniqueWithoutLogInput | TaskUpdateWithWhereUniqueWithoutLogInput[]
    updateMany?: TaskUpdateManyWithWhereWithoutLogInput | TaskUpdateManyWithWhereWithoutLogInput[]
    deleteMany?: TaskScalarWhereInput | TaskScalarWhereInput[]
  }

  export type ChatTurnUncheckedUpdateManyWithoutLogNestedInput = {
    create?: XOR<ChatTurnCreateWithoutLogInput, ChatTurnUncheckedCreateWithoutLogInput> | ChatTurnCreateWithoutLogInput[] | ChatTurnUncheckedCreateWithoutLogInput[]
    connectOrCreate?: ChatTurnCreateOrConnectWithoutLogInput | ChatTurnCreateOrConnectWithoutLogInput[]
    upsert?: ChatTurnUpsertWithWhereUniqueWithoutLogInput | ChatTurnUpsertWithWhereUniqueWithoutLogInput[]
    createMany?: ChatTurnCreateManyLogInputEnvelope
    set?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    disconnect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    delete?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    connect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    update?: ChatTurnUpdateWithWhereUniqueWithoutLogInput | ChatTurnUpdateWithWhereUniqueWithoutLogInput[]
    updateMany?: ChatTurnUpdateManyWithWhereWithoutLogInput | ChatTurnUpdateManyWithWhereWithoutLogInput[]
    deleteMany?: ChatTurnScalarWhereInput | ChatTurnScalarWhereInput[]
  }

  export type TaskUncheckedUpdateManyWithoutLogNestedInput = {
    create?: XOR<TaskCreateWithoutLogInput, TaskUncheckedCreateWithoutLogInput> | TaskCreateWithoutLogInput[] | TaskUncheckedCreateWithoutLogInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutLogInput | TaskCreateOrConnectWithoutLogInput[]
    upsert?: TaskUpsertWithWhereUniqueWithoutLogInput | TaskUpsertWithWhereUniqueWithoutLogInput[]
    createMany?: TaskCreateManyLogInputEnvelope
    set?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    disconnect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    delete?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    update?: TaskUpdateWithWhereUniqueWithoutLogInput | TaskUpdateWithWhereUniqueWithoutLogInput[]
    updateMany?: TaskUpdateManyWithWhereWithoutLogInput | TaskUpdateManyWithWhereWithoutLogInput[]
    deleteMany?: TaskScalarWhereInput | TaskScalarWhereInput[]
  }

  export type ChatTurnCreateNestedManyWithoutPersonInput = {
    create?: XOR<ChatTurnCreateWithoutPersonInput, ChatTurnUncheckedCreateWithoutPersonInput> | ChatTurnCreateWithoutPersonInput[] | ChatTurnUncheckedCreateWithoutPersonInput[]
    connectOrCreate?: ChatTurnCreateOrConnectWithoutPersonInput | ChatTurnCreateOrConnectWithoutPersonInput[]
    createMany?: ChatTurnCreateManyPersonInputEnvelope
    connect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
  }

  export type TaskCreateNestedManyWithoutPersonInput = {
    create?: XOR<TaskCreateWithoutPersonInput, TaskUncheckedCreateWithoutPersonInput> | TaskCreateWithoutPersonInput[] | TaskUncheckedCreateWithoutPersonInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutPersonInput | TaskCreateOrConnectWithoutPersonInput[]
    createMany?: TaskCreateManyPersonInputEnvelope
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
  }

  export type ChatTurnUncheckedCreateNestedManyWithoutPersonInput = {
    create?: XOR<ChatTurnCreateWithoutPersonInput, ChatTurnUncheckedCreateWithoutPersonInput> | ChatTurnCreateWithoutPersonInput[] | ChatTurnUncheckedCreateWithoutPersonInput[]
    connectOrCreate?: ChatTurnCreateOrConnectWithoutPersonInput | ChatTurnCreateOrConnectWithoutPersonInput[]
    createMany?: ChatTurnCreateManyPersonInputEnvelope
    connect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
  }

  export type TaskUncheckedCreateNestedManyWithoutPersonInput = {
    create?: XOR<TaskCreateWithoutPersonInput, TaskUncheckedCreateWithoutPersonInput> | TaskCreateWithoutPersonInput[] | TaskUncheckedCreateWithoutPersonInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutPersonInput | TaskCreateOrConnectWithoutPersonInput[]
    createMany?: TaskCreateManyPersonInputEnvelope
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
  }

  export type ChatTurnUpdateManyWithoutPersonNestedInput = {
    create?: XOR<ChatTurnCreateWithoutPersonInput, ChatTurnUncheckedCreateWithoutPersonInput> | ChatTurnCreateWithoutPersonInput[] | ChatTurnUncheckedCreateWithoutPersonInput[]
    connectOrCreate?: ChatTurnCreateOrConnectWithoutPersonInput | ChatTurnCreateOrConnectWithoutPersonInput[]
    upsert?: ChatTurnUpsertWithWhereUniqueWithoutPersonInput | ChatTurnUpsertWithWhereUniqueWithoutPersonInput[]
    createMany?: ChatTurnCreateManyPersonInputEnvelope
    set?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    disconnect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    delete?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    connect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    update?: ChatTurnUpdateWithWhereUniqueWithoutPersonInput | ChatTurnUpdateWithWhereUniqueWithoutPersonInput[]
    updateMany?: ChatTurnUpdateManyWithWhereWithoutPersonInput | ChatTurnUpdateManyWithWhereWithoutPersonInput[]
    deleteMany?: ChatTurnScalarWhereInput | ChatTurnScalarWhereInput[]
  }

  export type TaskUpdateManyWithoutPersonNestedInput = {
    create?: XOR<TaskCreateWithoutPersonInput, TaskUncheckedCreateWithoutPersonInput> | TaskCreateWithoutPersonInput[] | TaskUncheckedCreateWithoutPersonInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutPersonInput | TaskCreateOrConnectWithoutPersonInput[]
    upsert?: TaskUpsertWithWhereUniqueWithoutPersonInput | TaskUpsertWithWhereUniqueWithoutPersonInput[]
    createMany?: TaskCreateManyPersonInputEnvelope
    set?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    disconnect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    delete?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    update?: TaskUpdateWithWhereUniqueWithoutPersonInput | TaskUpdateWithWhereUniqueWithoutPersonInput[]
    updateMany?: TaskUpdateManyWithWhereWithoutPersonInput | TaskUpdateManyWithWhereWithoutPersonInput[]
    deleteMany?: TaskScalarWhereInput | TaskScalarWhereInput[]
  }

  export type ChatTurnUncheckedUpdateManyWithoutPersonNestedInput = {
    create?: XOR<ChatTurnCreateWithoutPersonInput, ChatTurnUncheckedCreateWithoutPersonInput> | ChatTurnCreateWithoutPersonInput[] | ChatTurnUncheckedCreateWithoutPersonInput[]
    connectOrCreate?: ChatTurnCreateOrConnectWithoutPersonInput | ChatTurnCreateOrConnectWithoutPersonInput[]
    upsert?: ChatTurnUpsertWithWhereUniqueWithoutPersonInput | ChatTurnUpsertWithWhereUniqueWithoutPersonInput[]
    createMany?: ChatTurnCreateManyPersonInputEnvelope
    set?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    disconnect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    delete?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    connect?: ChatTurnWhereUniqueInput | ChatTurnWhereUniqueInput[]
    update?: ChatTurnUpdateWithWhereUniqueWithoutPersonInput | ChatTurnUpdateWithWhereUniqueWithoutPersonInput[]
    updateMany?: ChatTurnUpdateManyWithWhereWithoutPersonInput | ChatTurnUpdateManyWithWhereWithoutPersonInput[]
    deleteMany?: ChatTurnScalarWhereInput | ChatTurnScalarWhereInput[]
  }

  export type TaskUncheckedUpdateManyWithoutPersonNestedInput = {
    create?: XOR<TaskCreateWithoutPersonInput, TaskUncheckedCreateWithoutPersonInput> | TaskCreateWithoutPersonInput[] | TaskUncheckedCreateWithoutPersonInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutPersonInput | TaskCreateOrConnectWithoutPersonInput[]
    upsert?: TaskUpsertWithWhereUniqueWithoutPersonInput | TaskUpsertWithWhereUniqueWithoutPersonInput[]
    createMany?: TaskCreateManyPersonInputEnvelope
    set?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    disconnect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    delete?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    update?: TaskUpdateWithWhereUniqueWithoutPersonInput | TaskUpdateWithWhereUniqueWithoutPersonInput[]
    updateMany?: TaskUpdateManyWithWhereWithoutPersonInput | TaskUpdateManyWithWhereWithoutPersonInput[]
    deleteMany?: TaskScalarWhereInput | TaskScalarWhereInput[]
  }

  export type LogCreateNestedOneWithoutChatTurnsInput = {
    create?: XOR<LogCreateWithoutChatTurnsInput, LogUncheckedCreateWithoutChatTurnsInput>
    connectOrCreate?: LogCreateOrConnectWithoutChatTurnsInput
    connect?: LogWhereUniqueInput
  }

  export type PersonCreateNestedOneWithoutChatTurnsInput = {
    create?: XOR<PersonCreateWithoutChatTurnsInput, PersonUncheckedCreateWithoutChatTurnsInput>
    connectOrCreate?: PersonCreateOrConnectWithoutChatTurnsInput
    connect?: PersonWhereUniqueInput
  }

  export type ChatMessageCreateNestedManyWithoutTurnInput = {
    create?: XOR<ChatMessageCreateWithoutTurnInput, ChatMessageUncheckedCreateWithoutTurnInput> | ChatMessageCreateWithoutTurnInput[] | ChatMessageUncheckedCreateWithoutTurnInput[]
    connectOrCreate?: ChatMessageCreateOrConnectWithoutTurnInput | ChatMessageCreateOrConnectWithoutTurnInput[]
    createMany?: ChatMessageCreateManyTurnInputEnvelope
    connect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
  }

  export type TaskCreateNestedManyWithoutSourceTurnInput = {
    create?: XOR<TaskCreateWithoutSourceTurnInput, TaskUncheckedCreateWithoutSourceTurnInput> | TaskCreateWithoutSourceTurnInput[] | TaskUncheckedCreateWithoutSourceTurnInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutSourceTurnInput | TaskCreateOrConnectWithoutSourceTurnInput[]
    createMany?: TaskCreateManySourceTurnInputEnvelope
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
  }

  export type ChatMessageUncheckedCreateNestedManyWithoutTurnInput = {
    create?: XOR<ChatMessageCreateWithoutTurnInput, ChatMessageUncheckedCreateWithoutTurnInput> | ChatMessageCreateWithoutTurnInput[] | ChatMessageUncheckedCreateWithoutTurnInput[]
    connectOrCreate?: ChatMessageCreateOrConnectWithoutTurnInput | ChatMessageCreateOrConnectWithoutTurnInput[]
    createMany?: ChatMessageCreateManyTurnInputEnvelope
    connect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
  }

  export type TaskUncheckedCreateNestedManyWithoutSourceTurnInput = {
    create?: XOR<TaskCreateWithoutSourceTurnInput, TaskUncheckedCreateWithoutSourceTurnInput> | TaskCreateWithoutSourceTurnInput[] | TaskUncheckedCreateWithoutSourceTurnInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutSourceTurnInput | TaskCreateOrConnectWithoutSourceTurnInput[]
    createMany?: TaskCreateManySourceTurnInputEnvelope
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
  }

  export type LogUpdateOneRequiredWithoutChatTurnsNestedInput = {
    create?: XOR<LogCreateWithoutChatTurnsInput, LogUncheckedCreateWithoutChatTurnsInput>
    connectOrCreate?: LogCreateOrConnectWithoutChatTurnsInput
    upsert?: LogUpsertWithoutChatTurnsInput
    connect?: LogWhereUniqueInput
    update?: XOR<XOR<LogUpdateToOneWithWhereWithoutChatTurnsInput, LogUpdateWithoutChatTurnsInput>, LogUncheckedUpdateWithoutChatTurnsInput>
  }

  export type PersonUpdateOneRequiredWithoutChatTurnsNestedInput = {
    create?: XOR<PersonCreateWithoutChatTurnsInput, PersonUncheckedCreateWithoutChatTurnsInput>
    connectOrCreate?: PersonCreateOrConnectWithoutChatTurnsInput
    upsert?: PersonUpsertWithoutChatTurnsInput
    connect?: PersonWhereUniqueInput
    update?: XOR<XOR<PersonUpdateToOneWithWhereWithoutChatTurnsInput, PersonUpdateWithoutChatTurnsInput>, PersonUncheckedUpdateWithoutChatTurnsInput>
  }

  export type ChatMessageUpdateManyWithoutTurnNestedInput = {
    create?: XOR<ChatMessageCreateWithoutTurnInput, ChatMessageUncheckedCreateWithoutTurnInput> | ChatMessageCreateWithoutTurnInput[] | ChatMessageUncheckedCreateWithoutTurnInput[]
    connectOrCreate?: ChatMessageCreateOrConnectWithoutTurnInput | ChatMessageCreateOrConnectWithoutTurnInput[]
    upsert?: ChatMessageUpsertWithWhereUniqueWithoutTurnInput | ChatMessageUpsertWithWhereUniqueWithoutTurnInput[]
    createMany?: ChatMessageCreateManyTurnInputEnvelope
    set?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    disconnect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    delete?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    connect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    update?: ChatMessageUpdateWithWhereUniqueWithoutTurnInput | ChatMessageUpdateWithWhereUniqueWithoutTurnInput[]
    updateMany?: ChatMessageUpdateManyWithWhereWithoutTurnInput | ChatMessageUpdateManyWithWhereWithoutTurnInput[]
    deleteMany?: ChatMessageScalarWhereInput | ChatMessageScalarWhereInput[]
  }

  export type TaskUpdateManyWithoutSourceTurnNestedInput = {
    create?: XOR<TaskCreateWithoutSourceTurnInput, TaskUncheckedCreateWithoutSourceTurnInput> | TaskCreateWithoutSourceTurnInput[] | TaskUncheckedCreateWithoutSourceTurnInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutSourceTurnInput | TaskCreateOrConnectWithoutSourceTurnInput[]
    upsert?: TaskUpsertWithWhereUniqueWithoutSourceTurnInput | TaskUpsertWithWhereUniqueWithoutSourceTurnInput[]
    createMany?: TaskCreateManySourceTurnInputEnvelope
    set?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    disconnect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    delete?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    update?: TaskUpdateWithWhereUniqueWithoutSourceTurnInput | TaskUpdateWithWhereUniqueWithoutSourceTurnInput[]
    updateMany?: TaskUpdateManyWithWhereWithoutSourceTurnInput | TaskUpdateManyWithWhereWithoutSourceTurnInput[]
    deleteMany?: TaskScalarWhereInput | TaskScalarWhereInput[]
  }

  export type ChatMessageUncheckedUpdateManyWithoutTurnNestedInput = {
    create?: XOR<ChatMessageCreateWithoutTurnInput, ChatMessageUncheckedCreateWithoutTurnInput> | ChatMessageCreateWithoutTurnInput[] | ChatMessageUncheckedCreateWithoutTurnInput[]
    connectOrCreate?: ChatMessageCreateOrConnectWithoutTurnInput | ChatMessageCreateOrConnectWithoutTurnInput[]
    upsert?: ChatMessageUpsertWithWhereUniqueWithoutTurnInput | ChatMessageUpsertWithWhereUniqueWithoutTurnInput[]
    createMany?: ChatMessageCreateManyTurnInputEnvelope
    set?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    disconnect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    delete?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    connect?: ChatMessageWhereUniqueInput | ChatMessageWhereUniqueInput[]
    update?: ChatMessageUpdateWithWhereUniqueWithoutTurnInput | ChatMessageUpdateWithWhereUniqueWithoutTurnInput[]
    updateMany?: ChatMessageUpdateManyWithWhereWithoutTurnInput | ChatMessageUpdateManyWithWhereWithoutTurnInput[]
    deleteMany?: ChatMessageScalarWhereInput | ChatMessageScalarWhereInput[]
  }

  export type TaskUncheckedUpdateManyWithoutSourceTurnNestedInput = {
    create?: XOR<TaskCreateWithoutSourceTurnInput, TaskUncheckedCreateWithoutSourceTurnInput> | TaskCreateWithoutSourceTurnInput[] | TaskUncheckedCreateWithoutSourceTurnInput[]
    connectOrCreate?: TaskCreateOrConnectWithoutSourceTurnInput | TaskCreateOrConnectWithoutSourceTurnInput[]
    upsert?: TaskUpsertWithWhereUniqueWithoutSourceTurnInput | TaskUpsertWithWhereUniqueWithoutSourceTurnInput[]
    createMany?: TaskCreateManySourceTurnInputEnvelope
    set?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    disconnect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    delete?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    connect?: TaskWhereUniqueInput | TaskWhereUniqueInput[]
    update?: TaskUpdateWithWhereUniqueWithoutSourceTurnInput | TaskUpdateWithWhereUniqueWithoutSourceTurnInput[]
    updateMany?: TaskUpdateManyWithWhereWithoutSourceTurnInput | TaskUpdateManyWithWhereWithoutSourceTurnInput[]
    deleteMany?: TaskScalarWhereInput | TaskScalarWhereInput[]
  }

  export type ChatTurnCreateNestedOneWithoutMessagesInput = {
    create?: XOR<ChatTurnCreateWithoutMessagesInput, ChatTurnUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: ChatTurnCreateOrConnectWithoutMessagesInput
    connect?: ChatTurnWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ChatTurnUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<ChatTurnCreateWithoutMessagesInput, ChatTurnUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: ChatTurnCreateOrConnectWithoutMessagesInput
    upsert?: ChatTurnUpsertWithoutMessagesInput
    connect?: ChatTurnWhereUniqueInput
    update?: XOR<XOR<ChatTurnUpdateToOneWithWhereWithoutMessagesInput, ChatTurnUpdateWithoutMessagesInput>, ChatTurnUncheckedUpdateWithoutMessagesInput>
  }

  export type PersonCreateNestedOneWithoutTasksInput = {
    create?: XOR<PersonCreateWithoutTasksInput, PersonUncheckedCreateWithoutTasksInput>
    connectOrCreate?: PersonCreateOrConnectWithoutTasksInput
    connect?: PersonWhereUniqueInput
  }

  export type LogCreateNestedOneWithoutTasksInput = {
    create?: XOR<LogCreateWithoutTasksInput, LogUncheckedCreateWithoutTasksInput>
    connectOrCreate?: LogCreateOrConnectWithoutTasksInput
    connect?: LogWhereUniqueInput
  }

  export type ChatTurnCreateNestedOneWithoutTasksInput = {
    create?: XOR<ChatTurnCreateWithoutTasksInput, ChatTurnUncheckedCreateWithoutTasksInput>
    connectOrCreate?: ChatTurnCreateOrConnectWithoutTasksInput
    connect?: ChatTurnWhereUniqueInput
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type PersonUpdateOneWithoutTasksNestedInput = {
    create?: XOR<PersonCreateWithoutTasksInput, PersonUncheckedCreateWithoutTasksInput>
    connectOrCreate?: PersonCreateOrConnectWithoutTasksInput
    upsert?: PersonUpsertWithoutTasksInput
    disconnect?: PersonWhereInput | boolean
    delete?: PersonWhereInput | boolean
    connect?: PersonWhereUniqueInput
    update?: XOR<XOR<PersonUpdateToOneWithWhereWithoutTasksInput, PersonUpdateWithoutTasksInput>, PersonUncheckedUpdateWithoutTasksInput>
  }

  export type LogUpdateOneWithoutTasksNestedInput = {
    create?: XOR<LogCreateWithoutTasksInput, LogUncheckedCreateWithoutTasksInput>
    connectOrCreate?: LogCreateOrConnectWithoutTasksInput
    upsert?: LogUpsertWithoutTasksInput
    disconnect?: LogWhereInput | boolean
    delete?: LogWhereInput | boolean
    connect?: LogWhereUniqueInput
    update?: XOR<XOR<LogUpdateToOneWithWhereWithoutTasksInput, LogUpdateWithoutTasksInput>, LogUncheckedUpdateWithoutTasksInput>
  }

  export type ChatTurnUpdateOneWithoutTasksNestedInput = {
    create?: XOR<ChatTurnCreateWithoutTasksInput, ChatTurnUncheckedCreateWithoutTasksInput>
    connectOrCreate?: ChatTurnCreateOrConnectWithoutTasksInput
    upsert?: ChatTurnUpsertWithoutTasksInput
    disconnect?: ChatTurnWhereInput | boolean
    delete?: ChatTurnWhereInput | boolean
    connect?: ChatTurnWhereUniqueInput
    update?: XOR<XOR<ChatTurnUpdateToOneWithWhereWithoutTasksInput, ChatTurnUpdateWithoutTasksInput>, ChatTurnUncheckedUpdateWithoutTasksInput>
  }

  export type AgentMessageCreateNestedManyWithoutSessionInput = {
    create?: XOR<AgentMessageCreateWithoutSessionInput, AgentMessageUncheckedCreateWithoutSessionInput> | AgentMessageCreateWithoutSessionInput[] | AgentMessageUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: AgentMessageCreateOrConnectWithoutSessionInput | AgentMessageCreateOrConnectWithoutSessionInput[]
    createMany?: AgentMessageCreateManySessionInputEnvelope
    connect?: AgentMessageWhereUniqueInput | AgentMessageWhereUniqueInput[]
  }

  export type AgentMessageUncheckedCreateNestedManyWithoutSessionInput = {
    create?: XOR<AgentMessageCreateWithoutSessionInput, AgentMessageUncheckedCreateWithoutSessionInput> | AgentMessageCreateWithoutSessionInput[] | AgentMessageUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: AgentMessageCreateOrConnectWithoutSessionInput | AgentMessageCreateOrConnectWithoutSessionInput[]
    createMany?: AgentMessageCreateManySessionInputEnvelope
    connect?: AgentMessageWhereUniqueInput | AgentMessageWhereUniqueInput[]
  }

  export type AgentMessageUpdateManyWithoutSessionNestedInput = {
    create?: XOR<AgentMessageCreateWithoutSessionInput, AgentMessageUncheckedCreateWithoutSessionInput> | AgentMessageCreateWithoutSessionInput[] | AgentMessageUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: AgentMessageCreateOrConnectWithoutSessionInput | AgentMessageCreateOrConnectWithoutSessionInput[]
    upsert?: AgentMessageUpsertWithWhereUniqueWithoutSessionInput | AgentMessageUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: AgentMessageCreateManySessionInputEnvelope
    set?: AgentMessageWhereUniqueInput | AgentMessageWhereUniqueInput[]
    disconnect?: AgentMessageWhereUniqueInput | AgentMessageWhereUniqueInput[]
    delete?: AgentMessageWhereUniqueInput | AgentMessageWhereUniqueInput[]
    connect?: AgentMessageWhereUniqueInput | AgentMessageWhereUniqueInput[]
    update?: AgentMessageUpdateWithWhereUniqueWithoutSessionInput | AgentMessageUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: AgentMessageUpdateManyWithWhereWithoutSessionInput | AgentMessageUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: AgentMessageScalarWhereInput | AgentMessageScalarWhereInput[]
  }

  export type AgentMessageUncheckedUpdateManyWithoutSessionNestedInput = {
    create?: XOR<AgentMessageCreateWithoutSessionInput, AgentMessageUncheckedCreateWithoutSessionInput> | AgentMessageCreateWithoutSessionInput[] | AgentMessageUncheckedCreateWithoutSessionInput[]
    connectOrCreate?: AgentMessageCreateOrConnectWithoutSessionInput | AgentMessageCreateOrConnectWithoutSessionInput[]
    upsert?: AgentMessageUpsertWithWhereUniqueWithoutSessionInput | AgentMessageUpsertWithWhereUniqueWithoutSessionInput[]
    createMany?: AgentMessageCreateManySessionInputEnvelope
    set?: AgentMessageWhereUniqueInput | AgentMessageWhereUniqueInput[]
    disconnect?: AgentMessageWhereUniqueInput | AgentMessageWhereUniqueInput[]
    delete?: AgentMessageWhereUniqueInput | AgentMessageWhereUniqueInput[]
    connect?: AgentMessageWhereUniqueInput | AgentMessageWhereUniqueInput[]
    update?: AgentMessageUpdateWithWhereUniqueWithoutSessionInput | AgentMessageUpdateWithWhereUniqueWithoutSessionInput[]
    updateMany?: AgentMessageUpdateManyWithWhereWithoutSessionInput | AgentMessageUpdateManyWithWhereWithoutSessionInput[]
    deleteMany?: AgentMessageScalarWhereInput | AgentMessageScalarWhereInput[]
  }

  export type AgentSessionCreateNestedOneWithoutMessagesInput = {
    create?: XOR<AgentSessionCreateWithoutMessagesInput, AgentSessionUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: AgentSessionCreateOrConnectWithoutMessagesInput
    connect?: AgentSessionWhereUniqueInput
  }

  export type AgentSessionUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<AgentSessionCreateWithoutMessagesInput, AgentSessionUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: AgentSessionCreateOrConnectWithoutMessagesInput
    upsert?: AgentSessionUpsertWithoutMessagesInput
    connect?: AgentSessionWhereUniqueInput
    update?: XOR<XOR<AgentSessionUpdateToOneWithWhereWithoutMessagesInput, AgentSessionUpdateWithoutMessagesInput>, AgentSessionUncheckedUpdateWithoutMessagesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type ChatTurnCreateWithoutLogInput = {
    id: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    person: PersonCreateNestedOneWithoutChatTurnsInput
    messages?: ChatMessageCreateNestedManyWithoutTurnInput
    tasks?: TaskCreateNestedManyWithoutSourceTurnInput
  }

  export type ChatTurnUncheckedCreateWithoutLogInput = {
    id: string
    personId: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    messages?: ChatMessageUncheckedCreateNestedManyWithoutTurnInput
    tasks?: TaskUncheckedCreateNestedManyWithoutSourceTurnInput
  }

  export type ChatTurnCreateOrConnectWithoutLogInput = {
    where: ChatTurnWhereUniqueInput
    create: XOR<ChatTurnCreateWithoutLogInput, ChatTurnUncheckedCreateWithoutLogInput>
  }

  export type ChatTurnCreateManyLogInputEnvelope = {
    data: ChatTurnCreateManyLogInput | ChatTurnCreateManyLogInput[]
  }

  export type TaskCreateWithoutLogInput = {
    id: string
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    person?: PersonCreateNestedOneWithoutTasksInput
    sourceTurn?: ChatTurnCreateNestedOneWithoutTasksInput
  }

  export type TaskUncheckedCreateWithoutLogInput = {
    id: string
    personId?: string | null
    sourceTurnId?: string | null
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type TaskCreateOrConnectWithoutLogInput = {
    where: TaskWhereUniqueInput
    create: XOR<TaskCreateWithoutLogInput, TaskUncheckedCreateWithoutLogInput>
  }

  export type TaskCreateManyLogInputEnvelope = {
    data: TaskCreateManyLogInput | TaskCreateManyLogInput[]
  }

  export type ChatTurnUpsertWithWhereUniqueWithoutLogInput = {
    where: ChatTurnWhereUniqueInput
    update: XOR<ChatTurnUpdateWithoutLogInput, ChatTurnUncheckedUpdateWithoutLogInput>
    create: XOR<ChatTurnCreateWithoutLogInput, ChatTurnUncheckedCreateWithoutLogInput>
  }

  export type ChatTurnUpdateWithWhereUniqueWithoutLogInput = {
    where: ChatTurnWhereUniqueInput
    data: XOR<ChatTurnUpdateWithoutLogInput, ChatTurnUncheckedUpdateWithoutLogInput>
  }

  export type ChatTurnUpdateManyWithWhereWithoutLogInput = {
    where: ChatTurnScalarWhereInput
    data: XOR<ChatTurnUpdateManyMutationInput, ChatTurnUncheckedUpdateManyWithoutLogInput>
  }

  export type ChatTurnScalarWhereInput = {
    AND?: ChatTurnScalarWhereInput | ChatTurnScalarWhereInput[]
    OR?: ChatTurnScalarWhereInput[]
    NOT?: ChatTurnScalarWhereInput | ChatTurnScalarWhereInput[]
    id?: StringFilter<"ChatTurn"> | string
    logId?: StringFilter<"ChatTurn"> | string
    personId?: StringFilter<"ChatTurn"> | string
    topic?: StringFilter<"ChatTurn"> | string
    capturedAt?: DateTimeFilter<"ChatTurn"> | Date | string
    rawAiResponse?: JsonNullableFilter<"ChatTurn">
    createdAt?: DateTimeFilter<"ChatTurn"> | Date | string
  }

  export type TaskUpsertWithWhereUniqueWithoutLogInput = {
    where: TaskWhereUniqueInput
    update: XOR<TaskUpdateWithoutLogInput, TaskUncheckedUpdateWithoutLogInput>
    create: XOR<TaskCreateWithoutLogInput, TaskUncheckedCreateWithoutLogInput>
  }

  export type TaskUpdateWithWhereUniqueWithoutLogInput = {
    where: TaskWhereUniqueInput
    data: XOR<TaskUpdateWithoutLogInput, TaskUncheckedUpdateWithoutLogInput>
  }

  export type TaskUpdateManyWithWhereWithoutLogInput = {
    where: TaskScalarWhereInput
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyWithoutLogInput>
  }

  export type TaskScalarWhereInput = {
    AND?: TaskScalarWhereInput | TaskScalarWhereInput[]
    OR?: TaskScalarWhereInput[]
    NOT?: TaskScalarWhereInput | TaskScalarWhereInput[]
    id?: StringFilter<"Task"> | string
    personId?: StringNullableFilter<"Task"> | string | null
    logId?: StringNullableFilter<"Task"> | string | null
    sourceTurnId?: StringNullableFilter<"Task"> | string | null
    title?: StringFilter<"Task"> | string
    description?: StringFilter<"Task"> | string
    dueAt?: DateTimeNullableFilter<"Task"> | Date | string | null
    status?: StringFilter<"Task"> | string
    fingerprint?: StringFilter<"Task"> | string
    evidence?: StringFilter<"Task"> | string
    rawAiResponse?: JsonNullableFilter<"Task">
    createdAt?: DateTimeFilter<"Task"> | Date | string
    updatedAt?: DateTimeFilter<"Task"> | Date | string
    completedAt?: DateTimeNullableFilter<"Task"> | Date | string | null
  }

  export type ChatTurnCreateWithoutPersonInput = {
    id: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    log: LogCreateNestedOneWithoutChatTurnsInput
    messages?: ChatMessageCreateNestedManyWithoutTurnInput
    tasks?: TaskCreateNestedManyWithoutSourceTurnInput
  }

  export type ChatTurnUncheckedCreateWithoutPersonInput = {
    id: string
    logId: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    messages?: ChatMessageUncheckedCreateNestedManyWithoutTurnInput
    tasks?: TaskUncheckedCreateNestedManyWithoutSourceTurnInput
  }

  export type ChatTurnCreateOrConnectWithoutPersonInput = {
    where: ChatTurnWhereUniqueInput
    create: XOR<ChatTurnCreateWithoutPersonInput, ChatTurnUncheckedCreateWithoutPersonInput>
  }

  export type ChatTurnCreateManyPersonInputEnvelope = {
    data: ChatTurnCreateManyPersonInput | ChatTurnCreateManyPersonInput[]
  }

  export type TaskCreateWithoutPersonInput = {
    id: string
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    log?: LogCreateNestedOneWithoutTasksInput
    sourceTurn?: ChatTurnCreateNestedOneWithoutTasksInput
  }

  export type TaskUncheckedCreateWithoutPersonInput = {
    id: string
    logId?: string | null
    sourceTurnId?: string | null
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type TaskCreateOrConnectWithoutPersonInput = {
    where: TaskWhereUniqueInput
    create: XOR<TaskCreateWithoutPersonInput, TaskUncheckedCreateWithoutPersonInput>
  }

  export type TaskCreateManyPersonInputEnvelope = {
    data: TaskCreateManyPersonInput | TaskCreateManyPersonInput[]
  }

  export type ChatTurnUpsertWithWhereUniqueWithoutPersonInput = {
    where: ChatTurnWhereUniqueInput
    update: XOR<ChatTurnUpdateWithoutPersonInput, ChatTurnUncheckedUpdateWithoutPersonInput>
    create: XOR<ChatTurnCreateWithoutPersonInput, ChatTurnUncheckedCreateWithoutPersonInput>
  }

  export type ChatTurnUpdateWithWhereUniqueWithoutPersonInput = {
    where: ChatTurnWhereUniqueInput
    data: XOR<ChatTurnUpdateWithoutPersonInput, ChatTurnUncheckedUpdateWithoutPersonInput>
  }

  export type ChatTurnUpdateManyWithWhereWithoutPersonInput = {
    where: ChatTurnScalarWhereInput
    data: XOR<ChatTurnUpdateManyMutationInput, ChatTurnUncheckedUpdateManyWithoutPersonInput>
  }

  export type TaskUpsertWithWhereUniqueWithoutPersonInput = {
    where: TaskWhereUniqueInput
    update: XOR<TaskUpdateWithoutPersonInput, TaskUncheckedUpdateWithoutPersonInput>
    create: XOR<TaskCreateWithoutPersonInput, TaskUncheckedCreateWithoutPersonInput>
  }

  export type TaskUpdateWithWhereUniqueWithoutPersonInput = {
    where: TaskWhereUniqueInput
    data: XOR<TaskUpdateWithoutPersonInput, TaskUncheckedUpdateWithoutPersonInput>
  }

  export type TaskUpdateManyWithWhereWithoutPersonInput = {
    where: TaskScalarWhereInput
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyWithoutPersonInput>
  }

  export type LogCreateWithoutChatTurnsInput = {
    id: string
    occurredAt: Date | string
    appName: string
    appBundleId?: string
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: string | null
    createdAt?: Date | string
    tasks?: TaskCreateNestedManyWithoutLogInput
  }

  export type LogUncheckedCreateWithoutChatTurnsInput = {
    id: string
    occurredAt: Date | string
    appName: string
    appBundleId?: string
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: string | null
    createdAt?: Date | string
    tasks?: TaskUncheckedCreateNestedManyWithoutLogInput
  }

  export type LogCreateOrConnectWithoutChatTurnsInput = {
    where: LogWhereUniqueInput
    create: XOR<LogCreateWithoutChatTurnsInput, LogUncheckedCreateWithoutChatTurnsInput>
  }

  export type PersonCreateWithoutChatTurnsInput = {
    id: string
    name: string
    clientApp?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: TaskCreateNestedManyWithoutPersonInput
  }

  export type PersonUncheckedCreateWithoutChatTurnsInput = {
    id: string
    name: string
    clientApp?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    tasks?: TaskUncheckedCreateNestedManyWithoutPersonInput
  }

  export type PersonCreateOrConnectWithoutChatTurnsInput = {
    where: PersonWhereUniqueInput
    create: XOR<PersonCreateWithoutChatTurnsInput, PersonUncheckedCreateWithoutChatTurnsInput>
  }

  export type ChatMessageCreateWithoutTurnInput = {
    id: string
    role: string
    senderName?: string | null
    senderNormalized?: string | null
    content: string
    contentType?: string
    quoteText?: string | null
    quoteSenderName?: string | null
    quoteRole?: string | null
    quoteContentType?: string | null
    isQuoted?: boolean
    isRevoked?: boolean
    messageKey?: string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: number
    createdAt?: Date | string
  }

  export type ChatMessageUncheckedCreateWithoutTurnInput = {
    id: string
    role: string
    senderName?: string | null
    senderNormalized?: string | null
    content: string
    contentType?: string
    quoteText?: string | null
    quoteSenderName?: string | null
    quoteRole?: string | null
    quoteContentType?: string | null
    isQuoted?: boolean
    isRevoked?: boolean
    messageKey?: string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: number
    createdAt?: Date | string
  }

  export type ChatMessageCreateOrConnectWithoutTurnInput = {
    where: ChatMessageWhereUniqueInput
    create: XOR<ChatMessageCreateWithoutTurnInput, ChatMessageUncheckedCreateWithoutTurnInput>
  }

  export type ChatMessageCreateManyTurnInputEnvelope = {
    data: ChatMessageCreateManyTurnInput | ChatMessageCreateManyTurnInput[]
  }

  export type TaskCreateWithoutSourceTurnInput = {
    id: string
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
    person?: PersonCreateNestedOneWithoutTasksInput
    log?: LogCreateNestedOneWithoutTasksInput
  }

  export type TaskUncheckedCreateWithoutSourceTurnInput = {
    id: string
    personId?: string | null
    logId?: string | null
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type TaskCreateOrConnectWithoutSourceTurnInput = {
    where: TaskWhereUniqueInput
    create: XOR<TaskCreateWithoutSourceTurnInput, TaskUncheckedCreateWithoutSourceTurnInput>
  }

  export type TaskCreateManySourceTurnInputEnvelope = {
    data: TaskCreateManySourceTurnInput | TaskCreateManySourceTurnInput[]
  }

  export type LogUpsertWithoutChatTurnsInput = {
    update: XOR<LogUpdateWithoutChatTurnsInput, LogUncheckedUpdateWithoutChatTurnsInput>
    create: XOR<LogCreateWithoutChatTurnsInput, LogUncheckedCreateWithoutChatTurnsInput>
    where?: LogWhereInput
  }

  export type LogUpdateToOneWithWhereWithoutChatTurnsInput = {
    where?: LogWhereInput
    data: XOR<LogUpdateWithoutChatTurnsInput, LogUncheckedUpdateWithoutChatTurnsInput>
  }

  export type LogUpdateWithoutChatTurnsInput = {
    id?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    appBundleId?: StringFieldUpdateOperationsInput | string
    isSend?: BoolFieldUpdateOperationsInput | boolean
    isWechat?: BoolFieldUpdateOperationsInput | boolean
    screenshotPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: TaskUpdateManyWithoutLogNestedInput
  }

  export type LogUncheckedUpdateWithoutChatTurnsInput = {
    id?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    appBundleId?: StringFieldUpdateOperationsInput | string
    isSend?: BoolFieldUpdateOperationsInput | boolean
    isWechat?: BoolFieldUpdateOperationsInput | boolean
    screenshotPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: TaskUncheckedUpdateManyWithoutLogNestedInput
  }

  export type PersonUpsertWithoutChatTurnsInput = {
    update: XOR<PersonUpdateWithoutChatTurnsInput, PersonUncheckedUpdateWithoutChatTurnsInput>
    create: XOR<PersonCreateWithoutChatTurnsInput, PersonUncheckedCreateWithoutChatTurnsInput>
    where?: PersonWhereInput
  }

  export type PersonUpdateToOneWithWhereWithoutChatTurnsInput = {
    where?: PersonWhereInput
    data: XOR<PersonUpdateWithoutChatTurnsInput, PersonUncheckedUpdateWithoutChatTurnsInput>
  }

  export type PersonUpdateWithoutChatTurnsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    clientApp?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: TaskUpdateManyWithoutPersonNestedInput
  }

  export type PersonUncheckedUpdateWithoutChatTurnsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    clientApp?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: TaskUncheckedUpdateManyWithoutPersonNestedInput
  }

  export type ChatMessageUpsertWithWhereUniqueWithoutTurnInput = {
    where: ChatMessageWhereUniqueInput
    update: XOR<ChatMessageUpdateWithoutTurnInput, ChatMessageUncheckedUpdateWithoutTurnInput>
    create: XOR<ChatMessageCreateWithoutTurnInput, ChatMessageUncheckedCreateWithoutTurnInput>
  }

  export type ChatMessageUpdateWithWhereUniqueWithoutTurnInput = {
    where: ChatMessageWhereUniqueInput
    data: XOR<ChatMessageUpdateWithoutTurnInput, ChatMessageUncheckedUpdateWithoutTurnInput>
  }

  export type ChatMessageUpdateManyWithWhereWithoutTurnInput = {
    where: ChatMessageScalarWhereInput
    data: XOR<ChatMessageUpdateManyMutationInput, ChatMessageUncheckedUpdateManyWithoutTurnInput>
  }

  export type ChatMessageScalarWhereInput = {
    AND?: ChatMessageScalarWhereInput | ChatMessageScalarWhereInput[]
    OR?: ChatMessageScalarWhereInput[]
    NOT?: ChatMessageScalarWhereInput | ChatMessageScalarWhereInput[]
    id?: StringFilter<"ChatMessage"> | string
    turnId?: StringFilter<"ChatMessage"> | string
    role?: StringFilter<"ChatMessage"> | string
    senderName?: StringNullableFilter<"ChatMessage"> | string | null
    senderNormalized?: StringNullableFilter<"ChatMessage"> | string | null
    content?: StringFilter<"ChatMessage"> | string
    contentType?: StringFilter<"ChatMessage"> | string
    quoteText?: StringNullableFilter<"ChatMessage"> | string | null
    quoteSenderName?: StringNullableFilter<"ChatMessage"> | string | null
    quoteRole?: StringNullableFilter<"ChatMessage"> | string | null
    quoteContentType?: StringNullableFilter<"ChatMessage"> | string | null
    isQuoted?: BoolFilter<"ChatMessage"> | boolean
    isRevoked?: BoolFilter<"ChatMessage"> | boolean
    messageKey?: StringFilter<"ChatMessage"> | string
    rawExtracted?: JsonNullableFilter<"ChatMessage">
    seq?: IntFilter<"ChatMessage"> | number
    createdAt?: DateTimeFilter<"ChatMessage"> | Date | string
  }

  export type TaskUpsertWithWhereUniqueWithoutSourceTurnInput = {
    where: TaskWhereUniqueInput
    update: XOR<TaskUpdateWithoutSourceTurnInput, TaskUncheckedUpdateWithoutSourceTurnInput>
    create: XOR<TaskCreateWithoutSourceTurnInput, TaskUncheckedCreateWithoutSourceTurnInput>
  }

  export type TaskUpdateWithWhereUniqueWithoutSourceTurnInput = {
    where: TaskWhereUniqueInput
    data: XOR<TaskUpdateWithoutSourceTurnInput, TaskUncheckedUpdateWithoutSourceTurnInput>
  }

  export type TaskUpdateManyWithWhereWithoutSourceTurnInput = {
    where: TaskScalarWhereInput
    data: XOR<TaskUpdateManyMutationInput, TaskUncheckedUpdateManyWithoutSourceTurnInput>
  }

  export type ChatTurnCreateWithoutMessagesInput = {
    id: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    log: LogCreateNestedOneWithoutChatTurnsInput
    person: PersonCreateNestedOneWithoutChatTurnsInput
    tasks?: TaskCreateNestedManyWithoutSourceTurnInput
  }

  export type ChatTurnUncheckedCreateWithoutMessagesInput = {
    id: string
    logId: string
    personId: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    tasks?: TaskUncheckedCreateNestedManyWithoutSourceTurnInput
  }

  export type ChatTurnCreateOrConnectWithoutMessagesInput = {
    where: ChatTurnWhereUniqueInput
    create: XOR<ChatTurnCreateWithoutMessagesInput, ChatTurnUncheckedCreateWithoutMessagesInput>
  }

  export type ChatTurnUpsertWithoutMessagesInput = {
    update: XOR<ChatTurnUpdateWithoutMessagesInput, ChatTurnUncheckedUpdateWithoutMessagesInput>
    create: XOR<ChatTurnCreateWithoutMessagesInput, ChatTurnUncheckedCreateWithoutMessagesInput>
    where?: ChatTurnWhereInput
  }

  export type ChatTurnUpdateToOneWithWhereWithoutMessagesInput = {
    where?: ChatTurnWhereInput
    data: XOR<ChatTurnUpdateWithoutMessagesInput, ChatTurnUncheckedUpdateWithoutMessagesInput>
  }

  export type ChatTurnUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    log?: LogUpdateOneRequiredWithoutChatTurnsNestedInput
    person?: PersonUpdateOneRequiredWithoutChatTurnsNestedInput
    tasks?: TaskUpdateManyWithoutSourceTurnNestedInput
  }

  export type ChatTurnUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    logId?: StringFieldUpdateOperationsInput | string
    personId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    tasks?: TaskUncheckedUpdateManyWithoutSourceTurnNestedInput
  }

  export type PersonCreateWithoutTasksInput = {
    id: string
    name: string
    clientApp?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    chatTurns?: ChatTurnCreateNestedManyWithoutPersonInput
  }

  export type PersonUncheckedCreateWithoutTasksInput = {
    id: string
    name: string
    clientApp?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    chatTurns?: ChatTurnUncheckedCreateNestedManyWithoutPersonInput
  }

  export type PersonCreateOrConnectWithoutTasksInput = {
    where: PersonWhereUniqueInput
    create: XOR<PersonCreateWithoutTasksInput, PersonUncheckedCreateWithoutTasksInput>
  }

  export type LogCreateWithoutTasksInput = {
    id: string
    occurredAt: Date | string
    appName: string
    appBundleId?: string
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: string | null
    createdAt?: Date | string
    chatTurns?: ChatTurnCreateNestedManyWithoutLogInput
  }

  export type LogUncheckedCreateWithoutTasksInput = {
    id: string
    occurredAt: Date | string
    appName: string
    appBundleId?: string
    isSend?: boolean
    isWechat?: boolean
    screenshotPath?: string | null
    createdAt?: Date | string
    chatTurns?: ChatTurnUncheckedCreateNestedManyWithoutLogInput
  }

  export type LogCreateOrConnectWithoutTasksInput = {
    where: LogWhereUniqueInput
    create: XOR<LogCreateWithoutTasksInput, LogUncheckedCreateWithoutTasksInput>
  }

  export type ChatTurnCreateWithoutTasksInput = {
    id: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    log: LogCreateNestedOneWithoutChatTurnsInput
    person: PersonCreateNestedOneWithoutChatTurnsInput
    messages?: ChatMessageCreateNestedManyWithoutTurnInput
  }

  export type ChatTurnUncheckedCreateWithoutTasksInput = {
    id: string
    logId: string
    personId: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    messages?: ChatMessageUncheckedCreateNestedManyWithoutTurnInput
  }

  export type ChatTurnCreateOrConnectWithoutTasksInput = {
    where: ChatTurnWhereUniqueInput
    create: XOR<ChatTurnCreateWithoutTasksInput, ChatTurnUncheckedCreateWithoutTasksInput>
  }

  export type PersonUpsertWithoutTasksInput = {
    update: XOR<PersonUpdateWithoutTasksInput, PersonUncheckedUpdateWithoutTasksInput>
    create: XOR<PersonCreateWithoutTasksInput, PersonUncheckedCreateWithoutTasksInput>
    where?: PersonWhereInput
  }

  export type PersonUpdateToOneWithWhereWithoutTasksInput = {
    where?: PersonWhereInput
    data: XOR<PersonUpdateWithoutTasksInput, PersonUncheckedUpdateWithoutTasksInput>
  }

  export type PersonUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    clientApp?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chatTurns?: ChatTurnUpdateManyWithoutPersonNestedInput
  }

  export type PersonUncheckedUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    clientApp?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chatTurns?: ChatTurnUncheckedUpdateManyWithoutPersonNestedInput
  }

  export type LogUpsertWithoutTasksInput = {
    update: XOR<LogUpdateWithoutTasksInput, LogUncheckedUpdateWithoutTasksInput>
    create: XOR<LogCreateWithoutTasksInput, LogUncheckedCreateWithoutTasksInput>
    where?: LogWhereInput
  }

  export type LogUpdateToOneWithWhereWithoutTasksInput = {
    where?: LogWhereInput
    data: XOR<LogUpdateWithoutTasksInput, LogUncheckedUpdateWithoutTasksInput>
  }

  export type LogUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    appBundleId?: StringFieldUpdateOperationsInput | string
    isSend?: BoolFieldUpdateOperationsInput | boolean
    isWechat?: BoolFieldUpdateOperationsInput | boolean
    screenshotPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chatTurns?: ChatTurnUpdateManyWithoutLogNestedInput
  }

  export type LogUncheckedUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    occurredAt?: DateTimeFieldUpdateOperationsInput | Date | string
    appName?: StringFieldUpdateOperationsInput | string
    appBundleId?: StringFieldUpdateOperationsInput | string
    isSend?: BoolFieldUpdateOperationsInput | boolean
    isWechat?: BoolFieldUpdateOperationsInput | boolean
    screenshotPath?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    chatTurns?: ChatTurnUncheckedUpdateManyWithoutLogNestedInput
  }

  export type ChatTurnUpsertWithoutTasksInput = {
    update: XOR<ChatTurnUpdateWithoutTasksInput, ChatTurnUncheckedUpdateWithoutTasksInput>
    create: XOR<ChatTurnCreateWithoutTasksInput, ChatTurnUncheckedCreateWithoutTasksInput>
    where?: ChatTurnWhereInput
  }

  export type ChatTurnUpdateToOneWithWhereWithoutTasksInput = {
    where?: ChatTurnWhereInput
    data: XOR<ChatTurnUpdateWithoutTasksInput, ChatTurnUncheckedUpdateWithoutTasksInput>
  }

  export type ChatTurnUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    log?: LogUpdateOneRequiredWithoutChatTurnsNestedInput
    person?: PersonUpdateOneRequiredWithoutChatTurnsNestedInput
    messages?: ChatMessageUpdateManyWithoutTurnNestedInput
  }

  export type ChatTurnUncheckedUpdateWithoutTasksInput = {
    id?: StringFieldUpdateOperationsInput | string
    logId?: StringFieldUpdateOperationsInput | string
    personId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: ChatMessageUncheckedUpdateManyWithoutTurnNestedInput
  }

  export type AgentMessageCreateWithoutSessionInput = {
    id: string
    role: string
    kind: string
    content?: string
    toolName?: string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: boolean
    seq?: number
    createdAt?: Date | string
  }

  export type AgentMessageUncheckedCreateWithoutSessionInput = {
    id: string
    role: string
    kind: string
    content?: string
    toolName?: string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: boolean
    seq?: number
    createdAt?: Date | string
  }

  export type AgentMessageCreateOrConnectWithoutSessionInput = {
    where: AgentMessageWhereUniqueInput
    create: XOR<AgentMessageCreateWithoutSessionInput, AgentMessageUncheckedCreateWithoutSessionInput>
  }

  export type AgentMessageCreateManySessionInputEnvelope = {
    data: AgentMessageCreateManySessionInput | AgentMessageCreateManySessionInput[]
  }

  export type AgentMessageUpsertWithWhereUniqueWithoutSessionInput = {
    where: AgentMessageWhereUniqueInput
    update: XOR<AgentMessageUpdateWithoutSessionInput, AgentMessageUncheckedUpdateWithoutSessionInput>
    create: XOR<AgentMessageCreateWithoutSessionInput, AgentMessageUncheckedCreateWithoutSessionInput>
  }

  export type AgentMessageUpdateWithWhereUniqueWithoutSessionInput = {
    where: AgentMessageWhereUniqueInput
    data: XOR<AgentMessageUpdateWithoutSessionInput, AgentMessageUncheckedUpdateWithoutSessionInput>
  }

  export type AgentMessageUpdateManyWithWhereWithoutSessionInput = {
    where: AgentMessageScalarWhereInput
    data: XOR<AgentMessageUpdateManyMutationInput, AgentMessageUncheckedUpdateManyWithoutSessionInput>
  }

  export type AgentMessageScalarWhereInput = {
    AND?: AgentMessageScalarWhereInput | AgentMessageScalarWhereInput[]
    OR?: AgentMessageScalarWhereInput[]
    NOT?: AgentMessageScalarWhereInput | AgentMessageScalarWhereInput[]
    id?: StringFilter<"AgentMessage"> | string
    sessionId?: StringFilter<"AgentMessage"> | string
    role?: StringFilter<"AgentMessage"> | string
    kind?: StringFilter<"AgentMessage"> | string
    content?: StringFilter<"AgentMessage"> | string
    toolName?: StringNullableFilter<"AgentMessage"> | string | null
    toolInput?: JsonNullableFilter<"AgentMessage">
    toolResult?: JsonNullableFilter<"AgentMessage">
    isError?: BoolFilter<"AgentMessage"> | boolean
    seq?: IntFilter<"AgentMessage"> | number
    createdAt?: DateTimeFilter<"AgentMessage"> | Date | string
  }

  export type AgentSessionCreateWithoutMessagesInput = {
    id: string
    userId: string
    title?: string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentSessionUncheckedCreateWithoutMessagesInput = {
    id: string
    userId: string
    title?: string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AgentSessionCreateOrConnectWithoutMessagesInput = {
    where: AgentSessionWhereUniqueInput
    create: XOR<AgentSessionCreateWithoutMessagesInput, AgentSessionUncheckedCreateWithoutMessagesInput>
  }

  export type AgentSessionUpsertWithoutMessagesInput = {
    update: XOR<AgentSessionUpdateWithoutMessagesInput, AgentSessionUncheckedUpdateWithoutMessagesInput>
    create: XOR<AgentSessionCreateWithoutMessagesInput, AgentSessionUncheckedCreateWithoutMessagesInput>
    where?: AgentSessionWhereInput
  }

  export type AgentSessionUpdateToOneWithWhereWithoutMessagesInput = {
    where?: AgentSessionWhereInput
    data: XOR<AgentSessionUpdateWithoutMessagesInput, AgentSessionUncheckedUpdateWithoutMessagesInput>
  }

  export type AgentSessionUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentSessionUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    screenContext?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatTurnCreateManyLogInput = {
    id: string
    personId: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type TaskCreateManyLogInput = {
    id: string
    personId?: string | null
    sourceTurnId?: string | null
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type ChatTurnUpdateWithoutLogInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    person?: PersonUpdateOneRequiredWithoutChatTurnsNestedInput
    messages?: ChatMessageUpdateManyWithoutTurnNestedInput
    tasks?: TaskUpdateManyWithoutSourceTurnNestedInput
  }

  export type ChatTurnUncheckedUpdateWithoutLogInput = {
    id?: StringFieldUpdateOperationsInput | string
    personId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: ChatMessageUncheckedUpdateManyWithoutTurnNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutSourceTurnNestedInput
  }

  export type ChatTurnUncheckedUpdateManyWithoutLogInput = {
    id?: StringFieldUpdateOperationsInput | string
    personId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TaskUpdateWithoutLogInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    person?: PersonUpdateOneWithoutTasksNestedInput
    sourceTurn?: ChatTurnUpdateOneWithoutTasksNestedInput
  }

  export type TaskUncheckedUpdateWithoutLogInput = {
    id?: StringFieldUpdateOperationsInput | string
    personId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceTurnId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TaskUncheckedUpdateManyWithoutLogInput = {
    id?: StringFieldUpdateOperationsInput | string
    personId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceTurnId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ChatTurnCreateManyPersonInput = {
    id: string
    logId: string
    topic?: string
    capturedAt: Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type TaskCreateManyPersonInput = {
    id: string
    logId?: string | null
    sourceTurnId?: string | null
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type ChatTurnUpdateWithoutPersonInput = {
    id?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    log?: LogUpdateOneRequiredWithoutChatTurnsNestedInput
    messages?: ChatMessageUpdateManyWithoutTurnNestedInput
    tasks?: TaskUpdateManyWithoutSourceTurnNestedInput
  }

  export type ChatTurnUncheckedUpdateWithoutPersonInput = {
    id?: StringFieldUpdateOperationsInput | string
    logId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    messages?: ChatMessageUncheckedUpdateManyWithoutTurnNestedInput
    tasks?: TaskUncheckedUpdateManyWithoutSourceTurnNestedInput
  }

  export type ChatTurnUncheckedUpdateManyWithoutPersonInput = {
    id?: StringFieldUpdateOperationsInput | string
    logId?: StringFieldUpdateOperationsInput | string
    topic?: StringFieldUpdateOperationsInput | string
    capturedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TaskUpdateWithoutPersonInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    log?: LogUpdateOneWithoutTasksNestedInput
    sourceTurn?: ChatTurnUpdateOneWithoutTasksNestedInput
  }

  export type TaskUncheckedUpdateWithoutPersonInput = {
    id?: StringFieldUpdateOperationsInput | string
    logId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceTurnId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TaskUncheckedUpdateManyWithoutPersonInput = {
    id?: StringFieldUpdateOperationsInput | string
    logId?: NullableStringFieldUpdateOperationsInput | string | null
    sourceTurnId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ChatMessageCreateManyTurnInput = {
    id: string
    role: string
    senderName?: string | null
    senderNormalized?: string | null
    content: string
    contentType?: string
    quoteText?: string | null
    quoteSenderName?: string | null
    quoteRole?: string | null
    quoteContentType?: string | null
    isQuoted?: boolean
    isRevoked?: boolean
    messageKey?: string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: number
    createdAt?: Date | string
  }

  export type TaskCreateManySourceTurnInput = {
    id: string
    personId?: string | null
    logId?: string | null
    title: string
    description?: string
    dueAt?: Date | string | null
    status?: string
    fingerprint: string
    evidence?: string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    completedAt?: Date | string | null
  }

  export type ChatMessageUpdateWithoutTurnInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    contentType?: StringFieldUpdateOperationsInput | string
    quoteText?: NullableStringFieldUpdateOperationsInput | string | null
    quoteSenderName?: NullableStringFieldUpdateOperationsInput | string | null
    quoteRole?: NullableStringFieldUpdateOperationsInput | string | null
    quoteContentType?: NullableStringFieldUpdateOperationsInput | string | null
    isQuoted?: BoolFieldUpdateOperationsInput | boolean
    isRevoked?: BoolFieldUpdateOperationsInput | boolean
    messageKey?: StringFieldUpdateOperationsInput | string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUncheckedUpdateWithoutTurnInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    contentType?: StringFieldUpdateOperationsInput | string
    quoteText?: NullableStringFieldUpdateOperationsInput | string | null
    quoteSenderName?: NullableStringFieldUpdateOperationsInput | string | null
    quoteRole?: NullableStringFieldUpdateOperationsInput | string | null
    quoteContentType?: NullableStringFieldUpdateOperationsInput | string | null
    isQuoted?: BoolFieldUpdateOperationsInput | boolean
    isRevoked?: BoolFieldUpdateOperationsInput | boolean
    messageKey?: StringFieldUpdateOperationsInput | string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ChatMessageUncheckedUpdateManyWithoutTurnInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    senderName?: NullableStringFieldUpdateOperationsInput | string | null
    senderNormalized?: NullableStringFieldUpdateOperationsInput | string | null
    content?: StringFieldUpdateOperationsInput | string
    contentType?: StringFieldUpdateOperationsInput | string
    quoteText?: NullableStringFieldUpdateOperationsInput | string | null
    quoteSenderName?: NullableStringFieldUpdateOperationsInput | string | null
    quoteRole?: NullableStringFieldUpdateOperationsInput | string | null
    quoteContentType?: NullableStringFieldUpdateOperationsInput | string | null
    isQuoted?: BoolFieldUpdateOperationsInput | boolean
    isRevoked?: BoolFieldUpdateOperationsInput | boolean
    messageKey?: StringFieldUpdateOperationsInput | string
    rawExtracted?: NullableJsonNullValueInput | InputJsonValue
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TaskUpdateWithoutSourceTurnInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    person?: PersonUpdateOneWithoutTasksNestedInput
    log?: LogUpdateOneWithoutTasksNestedInput
  }

  export type TaskUncheckedUpdateWithoutSourceTurnInput = {
    id?: StringFieldUpdateOperationsInput | string
    personId?: NullableStringFieldUpdateOperationsInput | string | null
    logId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type TaskUncheckedUpdateManyWithoutSourceTurnInput = {
    id?: StringFieldUpdateOperationsInput | string
    personId?: NullableStringFieldUpdateOperationsInput | string | null
    logId?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    dueAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    evidence?: StringFieldUpdateOperationsInput | string
    rawAiResponse?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type AgentMessageCreateManySessionInput = {
    id: string
    role: string
    kind: string
    content?: string
    toolName?: string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: boolean
    seq?: number
    createdAt?: Date | string
  }

  export type AgentMessageUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    toolName?: NullableStringFieldUpdateOperationsInput | string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: BoolFieldUpdateOperationsInput | boolean
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentMessageUncheckedUpdateWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    toolName?: NullableStringFieldUpdateOperationsInput | string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: BoolFieldUpdateOperationsInput | boolean
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AgentMessageUncheckedUpdateManyWithoutSessionInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    toolName?: NullableStringFieldUpdateOperationsInput | string | null
    toolInput?: NullableJsonNullValueInput | InputJsonValue
    toolResult?: NullableJsonNullValueInput | InputJsonValue
    isError?: BoolFieldUpdateOperationsInput | boolean
    seq?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}