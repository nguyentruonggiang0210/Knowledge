import { getKnowledgeCatalog } from './application/use-cases/getKnowledgeCatalog'
import { getSourceDocumentCatalog } from './application/use-cases/getSourceDocumentCatalog'
import { createSourceContentLoader } from './application/use-cases/loadSourceContent'
import { fileKnowledgeRepository } from './infrastructure/repositories/fileKnowledgeRepository'
import { generatedSourceDocumentRepository } from './infrastructure/repositories/generatedSourceDocumentRepository'
import { httpSourceContentRepository } from './infrastructure/repositories/httpSourceContentRepository'
import { KnowledgeLibraryPage } from './presentation/pages/KnowledgeLibraryPage'

const topics = getKnowledgeCatalog(fileKnowledgeRepository)
const sourceCoverage = getSourceDocumentCatalog(generatedSourceDocumentRepository)
const loadSourceContent = createSourceContentLoader(httpSourceContentRepository)

export default function App() {
  return (
    <KnowledgeLibraryPage
      topics={topics}
      sourceCoverage={sourceCoverage}
      loadSourceContent={loadSourceContent}
    />
  )
}
