import { apiRequest } from '@/lib/http/api-client'
import type {
  CreateQuestionRequest,
  Question,
  UpdateQuestionRequest,
} from '@/types/question-bank'

export function getQuestionsRequest() {
  return apiRequest<Question[]>('/question-bank/questions', {
    auth: true,
  })
}

export function getQuestionRequest(questionId: string) {
  return apiRequest<Question>(`/question-bank/questions/${questionId}`, {
    auth: true,
  })
}

export function createQuestionRequest(request: CreateQuestionRequest) {
  return apiRequest<Question>('/question-bank/questions', {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function updateQuestionRequest(
  questionId: string,
  request: UpdateQuestionRequest,
) {
  return apiRequest<Question>(`/question-bank/questions/${questionId}`, {
    auth: true,
    method: 'PUT',
    body: request,
  })
}

export function deleteQuestionRequest(questionId: string) {
  return apiRequest<void>(`/question-bank/questions/${questionId}`, {
    auth: true,
    method: 'DELETE',
  })
}
