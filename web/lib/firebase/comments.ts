import {
  collection,
  collectionGroup,
  doc,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore'

import { getValues, listenForValues } from './utils'
import { db } from './init'
import { User } from 'common/user'
import { Comment } from 'common/comment'
import { removeUndefinedProps } from 'common/util/object'
import { track } from '@amplitude/analytics-browser'
import { JSONContent } from '@tiptap/react'

export type { Comment }

export const MAX_COMMENT_LENGTH = 10000

export async function createCommentOnContract(
  contractId: string,
  content: JSONContent,
  commenter: User,
  betId?: string,
  answerOutcome?: string,
  replyToCommentId?: string
) {
  const ref = betId
    ? doc(getCommentsCollection(contractId), betId)
    : doc(getCommentsCollection(contractId))
  const comment: Comment = removeUndefinedProps({
    id: ref.id,
    contractId,
    userId: commenter.id,
    content: content,
    createdTime: Date.now(),
    userName: commenter.name,
    userUsername: commenter.username,
    userAvatarUrl: commenter.avatarUrl,
    betId: betId,
    answerOutcome: answerOutcome,
    replyToCommentId: replyToCommentId,
  })
  track('comment', {
    contractId,
    commentId: ref.id,
    betId: betId,
    replyToCommentId: replyToCommentId,
  })
  return await setDoc(ref, comment)
}
export async function createCommentOnGroup(
  groupId: string,
  content: JSONContent,
  user: User,
  replyToCommentId?: string
) {
  const ref = doc(getCommentsOnGroupCollection(groupId))
  const comment: Comment = removeUndefinedProps({
    id: ref.id,
    groupId,
    userId: user.id,
    content: content,
    createdTime: Date.now(),
    userName: user.name,
    userUsername: user.username,
    userAvatarUrl: user.avatarUrl,
    replyToCommentId: replyToCommentId,
  })
  track('group message', {
    user,
    commentId: ref.id,
    groupId,
    replyToCommentId: replyToCommentId,
  })
  return await setDoc(ref, comment)
}

function getCommentsCollection(contractId: string) {
  return collection(db, 'contracts', contractId, 'comments')
}

function getCommentsOnGroupCollection(groupId: string) {
  return collection(db, 'groups', groupId, 'comments')
}

export async function listAllComments(contractId: string) {
  const comments = await getValues<Comment>(getCommentsCollection(contractId))
  comments.sort((c1, c2) => c1.createdTime - c2.createdTime)
  return comments
}

export async function listAllCommentsOnGroup(groupId: string) {
  const comments = await getValues<Comment>(
    getCommentsOnGroupCollection(groupId)
  )
  comments.sort((c1, c2) => c1.createdTime - c2.createdTime)
  return comments
}

export function listenForCommentsOnContract(
  contractId: string,
  setComments: (comments: Comment[]) => void
) {
  return listenForValues<Comment>(
    getCommentsCollection(contractId),
    (comments) => {
      comments.sort((c1, c2) => c1.createdTime - c2.createdTime)
      setComments(comments)
    }
  )
}
export function listenForCommentsOnGroup(
  groupId: string,
  setComments: (comments: Comment[]) => void
) {
  return listenForValues<Comment>(
    getCommentsOnGroupCollection(groupId),
    (comments) => {
      comments.sort((c1, c2) => c1.createdTime - c2.createdTime)
      setComments(comments)
    }
  )
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

// Define "recent" as "<3 days ago" for now
const recentCommentsQuery = query(
  collectionGroup(db, 'comments'),
  where('createdTime', '>', Date.now() - 3 * DAY_IN_MS),
  orderBy('createdTime', 'desc')
)

export async function getRecentComments() {
  return getValues<Comment>(recentCommentsQuery)
}

export function listenForRecentComments(
  setComments: (comments: Comment[]) => void
) {
  return listenForValues<Comment>(recentCommentsQuery, setComments)
}

const getUsersCommentsQuery = (userId: string) =>
  query(
    collectionGroup(db, 'comments'),
    where('userId', '==', userId),
    orderBy('createdTime', 'desc')
  )
export async function getUsersComments(userId: string) {
  return await getValues<Comment>(getUsersCommentsQuery(userId))
}
