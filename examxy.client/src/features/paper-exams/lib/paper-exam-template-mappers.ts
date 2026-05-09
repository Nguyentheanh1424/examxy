import { useSearchParams } from 'react-router-dom'

import type {
  CreatePaperExamTemplateRequest,
  CreatePaperExamTemplateVersionRequest,
  PaperExamMetadataField,
  PaperExamTemplateVersion,
} from '@/types/paper-exam'
import {
  defaultTemplateSettings,
  templateMaster,
  type TemplateSettings,
} from '@/features/paper-exams/lib/paper-exam-template-generator'


export interface TemplateDraftState {
  code: string
  name: string
  description: string
  settings: TemplateSettings
  paperSize: string
  markerScheme: string
  outputWidth: string
  outputHeight: string
  hasStudentIdField: boolean
  hasQuizIdField: boolean
  hasHandwrittenRegions: boolean
}

export interface VersionDraftState {
  schemaVersion: string
  questionCount: string
  optionsPerQuestion: string
  absThreshold: string
  relThreshold: string
  scoringMethod: string
  scoringParamsJson: string
  payloadSchemaVersion: string
  minClientAppVersion: string
}

export interface MetadataFieldDraftState {
  fieldCode: string
  label: string
  decodeMode: string
  isRequired: boolean
  geometryJson: string
  validationPolicyJson: string
}

export type JsonAssetType =
  | 'MarkerLayout'
  | 'CircleRois'
  | 'IdBubbleFields'
  | 'RegionWindows'

export const jsonAssetTypes: JsonAssetType[] = [
  'MarkerLayout',
  'CircleRois',
  'IdBubbleFields',
  'RegionWindows',
]

export const emptyTemplateDraft: TemplateDraftState = {
  code: '',
  name: '',
  description: '',
  settings: defaultTemplateSettings,
  paperSize: 'A4',
  markerScheme: 'custom',
  outputWidth: String(templateMaster.width),
  outputHeight: String(templateMaster.height),
  hasStudentIdField: true,
  hasQuizIdField: true,
  hasHandwrittenRegions: true,
}

export const emptyVersionDraft: VersionDraftState = {
  schemaVersion: '1.0',
  questionCount: '1',
  optionsPerQuestion: '4',
  absThreshold: '0.7',
  relThreshold: '0.25',
  scoringMethod: 'annulus_patch_darkness',
  scoringParamsJson: '{}',
  payloadSchemaVersion: '1.0',
  minClientAppVersion: '',
}

export const emptyMetadataFieldDraft: MetadataFieldDraftState = {
  fieldCode: '',
  label: '',
  decodeMode: 'bubble_grid',
  isRequired: false,
  geometryJson: '{}',
  validationPolicyJson: '{}',
}

export const emptyJsonAssetDrafts: Record<JsonAssetType, string> = {
  MarkerLayout: '',
  CircleRois: '',
  IdBubbleFields: '',
  RegionWindows: '',
}

export function toCreateTemplateRequest(
  state: TemplateDraftState,
): CreatePaperExamTemplateRequest {
  return {
    code: state.code.trim(),
    name: state.name.trim(),
    description: state.description.trim(),
    paperSize: 'A4',
    outputWidth: templateMaster.width,
    outputHeight: templateMaster.height,
    markerScheme: 'custom',
    hasStudentIdField: state.settings.showStudentIdField,
    hasQuizIdField: state.settings.showQuizIdField,
    hasHandwrittenRegions: Object.values(state.settings.visibleHeaderLabels).some(Boolean),
  }
}

export function toVersionRequest(
  state: VersionDraftState,
): CreatePaperExamTemplateVersionRequest {
  return {
    schemaVersion: state.schemaVersion.trim() || '1.0',
    questionCount: Number(state.questionCount) || 1,
    optionsPerQuestion: Number(state.optionsPerQuestion) || 4,
    absThreshold: Number(state.absThreshold) || 0.7,
    relThreshold: Number(state.relThreshold) || 0.25,
    scoringMethod: state.scoringMethod.trim() || 'annulus_patch_darkness',
    scoringParamsJson: state.scoringParamsJson || '{}',
    payloadSchemaVersion: state.payloadSchemaVersion.trim() || '1.0',
    minClientAppVersion: state.minClientAppVersion.trim() || null,
  }
}

export function toVersionDraftState(version: PaperExamTemplateVersion): VersionDraftState {
  return {
    schemaVersion: version.schemaVersion,
    questionCount: String(version.questionCount),
    optionsPerQuestion: String(version.optionsPerQuestion),
    absThreshold: String(version.absThreshold),
    relThreshold: String(version.relThreshold),
    scoringMethod: version.scoringMethod,
    scoringParamsJson: version.scoringParamsJson,
    payloadSchemaVersion: version.payloadSchemaVersion,
    minClientAppVersion: version.minClientAppVersion ?? '',
  }
}

export function toMetadataFieldDraftState(
  field: PaperExamMetadataField,
): MetadataFieldDraftState {
  return {
    fieldCode: field.fieldCode,
    label: field.label,
    decodeMode: field.decodeMode,
    isRequired: field.isRequired,
    geometryJson: field.geometryJson,
    validationPolicyJson: field.validationPolicyJson,
  }
}

export function getAssetByType(
  version: PaperExamTemplateVersion | null,
  assetType: string,
) {
  return version?.assets.find((asset) => asset.assetType === assetType) ?? null
}

export function createJsonAssetDrafts(version: PaperExamTemplateVersion | null) {
  return {
    MarkerLayout: getAssetByType(version, 'MarkerLayout')?.jsonContent ?? '',
    CircleRois: getAssetByType(version, 'CircleRois')?.jsonContent ?? '',
    IdBubbleFields: getAssetByType(version, 'IdBubbleFields')?.jsonContent ?? '',
    RegionWindows: getAssetByType(version, 'RegionWindows')?.jsonContent ?? '',
  }
}

export function createMetadataDrafts(version: PaperExamTemplateVersion | null) {
  return version?.metadataFields.length
    ? version.metadataFields.map(toMetadataFieldDraftState)
    : []
}

export async function fileToBase64(file: File) {
  const bytes = await file.arrayBuffer()
  let binary = ''
  const view = new Uint8Array(bytes)

  for (const byte of view) {
    binary += String.fromCharCode(byte)
  }

  return window.btoa(binary)
}

export function updateSearchSelection(
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  templateId: string | null,
  versionId?: string | null,
) {
  const nextParams = new URLSearchParams()

  if (templateId) {
    nextParams.set('templateId', templateId)
  }

  if (versionId) {
    nextParams.set('versionId', versionId)
  }

  setSearchParams(nextParams, { replace: true })
}
