// Stub for @coral-xyz/anchor — only needed for Solana adapter.
// We use the viem (EVM) adapter so this is never called.
const noop = () => {}
const noopClass = class {}

export default { Program: noopClass, BN: noopClass, web3: {}, utils: {}, AnchorProvider: noopClass }
export const Program = noopClass
export const BN = noopClass
export const web3 = {}
export const utils = { bytes: {}, token: {} }
export const AnchorProvider = noopClass
export const setProvider = noop
export const getProvider = noop
export const workspace = {}
export const EventParser = noopClass
export const BorshAccountsCoder = noopClass
export const BorshCoder = noopClass
export const BorshInstructionCoder = noopClass
export const BorshEventCoder = noopClass
export const BorshTypesCoder = noopClass
export const Idl = {}
export const IdlError = noopClass
export const parseIdlErrors = noop
export const translateError = noop
export const splitArgsAndCtx = noop
export const AccountClient = noopClass
export const MethodsBuilder = noopClass
export const DISCRIMINATOR_SIZE = 8
