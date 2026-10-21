import type { BetterAuthOptions } from 'better-auth';
import type { DBAdapter, DBTransactionAdapter } from 'better-auth/adapters';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import type { PrismaClient } from '@/generated/prisma/client';
import { credentialAccountWhere } from './credential-fields';

const userFields = ['id', 'name', 'email', 'image', 'role', 'createdAt', 'updatedAt'];
const accountFields = [
  'id',
  'userId',
  'password',
  'createdAt',
  'updatedAt',
];

function virtualVerification<T>(record: T): T {
  // Better Auth's internal User type expects this value. No column or verification flow exists.
  if (!record || typeof record !== 'object') return record;
  return {
    ...record,
    emailVerified: false,
    ...('account' in record && Array.isArray(record.account)
      ? { account: record.account.map(virtualCredential) }
      : {}),
  };
}

function virtualCredential<T>(record: T): T {
  return record && typeof record === 'object' && 'userId' in record
    ? { ...record, providerId: 'credential', accountId: record.userId }
    : record;
}

function projectRecord<T>(model: string, record: T): T {
  return model === 'user'
    ? virtualVerification(record)
    : model === 'account'
      ? virtualCredential(record)
      : record;
}

function credentialProjection(adapter: DBTransactionAdapter): DBTransactionAdapter {
  const project = (input: { model: string; select?: string[] }) => {
    if (input.model === 'user')
      return { ...input, select: input.select?.filter((field) => field !== 'emailVerified') ?? userFields };
    if (input.model === 'account')
      return {
        ...input,
        select: input.select
          ? [
              ...new Set([
                ...input.select.filter((field) => !['providerId', 'accountId'].includes(field)),
                'userId',
              ]),
            ]
          : accountFields,
      };
    return input;
  };
  const rejectUserWrite = (model: string) => {
    if (model === 'user') throw new Error('User identity changes require the provisioning workflow.');
  };
  return {
    ...adapter,
    async findOne<T>(input: Parameters<DBAdapter['findOne']>[0]) {
      if (input.where.some((condition) => condition.field === 'emailVerified'))
        throw new Error('Email verification is not supported.');
      const where = input.model === 'account' ? credentialAccountWhere(input.where) : input.where;
      if (where === null) return null;
      const record = await adapter.findOne<T>({ ...input, ...project(input), where });
      return projectRecord(input.model, record);
    },
    async findMany<T>(input: Parameters<DBAdapter['findMany']>[0]) {
      const where = input.model === 'account' ? credentialAccountWhere(input.where) : input.where;
      if (where === null) return [];
      const records = await adapter.findMany<T>({ ...input, ...project(input), where });
      return records.map((record) => projectRecord(input.model, record));
    },
    async count(input) {
      const where = input.model === 'account' ? credentialAccountWhere(input.where) : input.where;
      return where === null ? 0 : adapter.count({ ...input, where });
    },
    create(input) {
      rejectUserWrite(input.model);
      if (input.model === 'account') throw new Error('Password accounts require the provisioning workflow.');
      return adapter.create(input);
    },
    async update<T>(input: Parameters<DBAdapter['update']>[0]) {
      rejectUserWrite(input.model);
      const record = await adapter.update<T>(input);
      return projectRecord(input.model, record);
    },
    updateMany(input) {
      rejectUserWrite(input.model);
      return adapter.updateMany(input);
    },
    delete(input) {
      rejectUserWrite(input.model);
      return adapter.delete(input);
    },
    deleteMany(input) {
      rejectUserWrite(input.model);
      return adapter.deleteMany(input);
    },
    consumeOne(input) {
      rejectUserWrite(input.model);
      return adapter.consumeOne(input);
    },
    incrementOne(input) {
      rejectUserWrite(input.model);
      return adapter.incrementOne(input);
    },
  };
}

export function credentialAdapter(database: PrismaClient) {
  const createAdapter = prismaAdapter(database, { provider: 'postgresql', transaction: true });
  return (options: BetterAuthOptions): DBAdapter => {
    if (
      options.emailAndPassword?.requireEmailVerification ||
      Object.keys(options.emailVerification ?? {}).length ||
      Object.keys(options.socialProviders ?? {}).length
    )
      throw new Error('This adapter supports provisioned email/password accounts only.');
    const adapter = createAdapter(options);
    // A custom projection replaces the stock adapter's column-based schema check.
    // Login, password changes, and joins are covered by the real-database integration suite.
    return {
      ...credentialProjection(adapter),
      transaction: (callback) =>
        adapter.transaction((transaction) => callback(credentialProjection(transaction))),
    };
  };
}
