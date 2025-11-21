/**
 * [설명] Sanity Studio 설정 파일
 * [목적] Sanity CMS 프로젝트 구성 및 스키마 정의
 */

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './lib/schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export default defineConfig({
  name: 'default',
  title: 'Kulture CMS',

  projectId,
  dataset,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // 콘텐츠 관리
            S.listItem()
              .title('Posts')
              .child(S.documentTypeList('post').title('Posts')),
            S.listItem()
              .title('Authors')
              .child(S.documentTypeList('author').title('Authors')),
            S.listItem()
              .title('Categories')
              .child(S.documentTypeList('category').title('Categories')),
            S.divider(),

            // 트렌드 & VIP
            S.listItem()
              .title('Hot Issues')
              .child(S.documentTypeList('hotIssue').title('Hot Issues')),
            S.listItem()
              .title('Trend Tracking')
              .child(S.documentTypeList('trendTracking').title('Trend Tracking')),
            S.listItem()
              .title('Trend Snapshots')
              .child(S.documentTypeList('trendSnapshot').title('Trend Snapshots')),
            S.listItem()
              .title('VIP Monitoring')
              .child(S.documentTypeList('vipMonitoring').title('VIP Monitoring')),
            S.divider(),

            // 리포트 & 피드백
            S.listItem()
              .title('Daily Reports')
              .child(S.documentTypeList('dailyReport').title('Daily Reports')),
            S.listItem()
              .title('CEO Feedback')
              .child(S.documentTypeList('ceoFeedback').title('CEO Feedback')),
            S.listItem()
              .title('Performance Reports')
              .child(S.documentTypeList('performanceReport').title('Performance Reports')),
            S.divider(),

            // 설정
            S.listItem()
              .title('Site Settings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
