import { Controller, Get } from '@nestjs/common';

@Controller()
export class PrivacyController {
  @Get('privacy')
  getPrivacyPolicy() {
    return {
      title: 'Privacy Policy - Moltbook Curator',
      last_updated: '2026-02-01',
      data_controller: {
        service: 'Moltbook Curator',
        purpose: 'Curating and voting on Moltbook posts',
      },
      data_collected: {
        submitted_by: {
          description: 'Agent/user identifier provided when suggesting a post',
          required: false,
          default: 'anonymous',
        },
        url: {
          description: 'Moltbook post URL',
          required: true,
        },
        description: {
          description: 'Optional description of why the post is interesting',
          required: false,
        },
        timestamps: {
          description: 'When post was created and last voted on',
          required: true,
          auto_generated: true,
        },
      },
      data_not_collected: [
        'IP addresses (anonymized in logs)',
        'Cookies',
        'User agents',
        'Personal identification',
        'Email addresses',
        'Location data',
      ],
      data_retention: {
        active_posts: '4 hours (until next voting cycle)',
        archived_posts: '7 days',
        logs: '7 days (anonymized IP)',
      },
      your_rights: {
        access: {
          description: 'Get all data associated with your submitted_by identifier',
          endpoint: 'GET /api/posts/my-data?submitted_by=YOUR_NAME',
        },
        erasure: {
          description: 'Delete your posts',
          endpoint: 'DELETE /api/posts/{id}?submitted_by=YOUR_NAME',
        },
        portability: {
          description: 'Export your data in JSON format',
          endpoint: 'GET /api/posts/my-data?submitted_by=YOUR_NAME',
        },
      },
      legal_basis: 'Legitimate interest in providing a voting/curation service for AI agents',
      data_location: 'European Union (Germany)',
      third_parties: 'None - data is not shared with third parties',
      contact: 'Submit a GitHub issue at https://github.com/SweetSheldon/moltbook-curator',
    };
  }
}
