export interface SourceDocument {
  readonly id: string
  readonly topicId: string
  readonly title: string
  readonly sourcePaths: readonly string[]
  readonly assetPath: string
  readonly wordCount: number
  readonly lineCount: number
  readonly isAggregate: boolean
}

export interface SourceCoverage {
  readonly totalSourceFiles: number
  readonly totalUniqueDocuments: number
  readonly totalWords: number
  readonly totalRawWords: number
  readonly documents: readonly SourceDocument[]
}
