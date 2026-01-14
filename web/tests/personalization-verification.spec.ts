import { test, expect } from '@playwright/test'

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  }
}

test.describe('Personalization page', () => {
  test('renders sections and runs personalization flows', async ({ page }) => {
    let lastDifficultyBody: unknown = null
    let lastLearningPathBody: unknown = null

    await page.route('**/api/v1/personalization/**', async route => {
      const request = route.request()
      const { pathname } = new URL(request.url())

      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders() })
        return
      }

      if (pathname.endsWith('/api/v1/personalization/learning-style')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders(),
          contentType: 'application/json',
          body: JSON.stringify({
            style: 'visual',
            confidence: 0.84,
            evidence: [
              'You retain information best when concepts are structured visually.',
              'You frequently revisit diagrams, charts, and spatial layouts.',
            ],
            recommendations: [
              'Use mind maps and concept graphs for new topics.',
              'Prefer slides or illustrated notes over long audio sessions.',
            ],
          }),
        })
        return
      }

      if (pathname.endsWith('/api/v1/personalization/difficulty')) {
        if (request.method() === 'POST') lastDifficultyBody = request.postDataJSON()
        await route.fulfill({
          status: 200,
          headers: corsHeaders(),
          contentType: 'application/json',
          body: JSON.stringify({
            topic: 'Linear algebra',
            level: 'intermediate',
            confidence: 0.76,
            reasoning:
              'Your prior activity suggests strong fundamentals with some advanced gaps (e.g., SVD intuition and spectral decompositions).',
            suggested_next_steps: [
              'Review vector spaces + basis changes with worked examples.',
              'Practice eigenvalues/eigenvectors and diagonalization on 10 problems.',
              'Move to SVD/PCA applications once comfortable.',
            ],
          }),
        })
        return
      }

      if (pathname.endsWith('/api/v1/personalization/learning-path')) {
        if (request.method() === 'POST') lastLearningPathBody = request.postDataJSON()
        await route.fulfill({
          status: 200,
          headers: corsHeaders(),
          contentType: 'application/json',
          body: JSON.stringify({
            topic: 'Neural networks',
            current_level: 'intermediate',
            target_level: 'advanced',
            learning_style: 'visual',
            overview:
              'A project-driven path focusing on fundamentals → architecture intuition → systems + research skills.',
            estimated_total_hours: 42,
            milestones: [
              {
                title: 'Foundations refresher',
                description: 'Tighten calculus, linear algebra, and probability essentials.',
                estimated_hours: 8,
                resources: ['Khan Academy notes', 'Matrix calculus cheat-sheet'],
                activities: ['Derive backprop for a 2-layer MLP', 'Implement SGD from scratch'],
                success_criteria: ['Can compute gradients for common layers without referencing notes.'],
              },
              {
                title: 'Modern architectures',
                description: 'Transformers, normalization, attention patterns, and optimization.',
                estimated_hours: 18,
                resources: ['Attention Is All You Need', 'The Annotated Transformer'],
                activities: ['Train a small transformer on a toy dataset', 'Tune LR schedules'],
                success_criteria: ['Can explain attention scaling + failure modes.'],
              },
              {
                title: 'Research & production habits',
                description: 'Reading papers, ablations, evals, and deployment constraints.',
                estimated_hours: 16,
                resources: ['Papers With Code', 'MLOps basics'],
                activities: ['Reproduce a paper figure', 'Write an ablation plan'],
                success_criteria: ['Can design an eval suite and justify metric choices.'],
              },
            ],
            tips: ['Keep sessions to 45–60 minutes with short breaks.', 'Ship tiny demos weekly.'],
          }),
        })
        return
      }

      if (pathname.endsWith('/api/v1/personalization/behavior-insights')) {
        await route.fulfill({
          status: 200,
          headers: corsHeaders(),
          contentType: 'application/json',
          body: JSON.stringify({
            user_id: 'test-user',
            analyzed_at: 1730000000,
            strengths: ['Deep focus in longer sessions', 'Strong follow-through on milestones'],
            improvement_areas: ['Context switching between topics', 'Starting sessions without clear goals'],
            patterns: {
              consistency: 'Most productive on Tue–Thu; weekends are lighter.',
              focus_duration: 'Peak focus window ~52 minutes before attention drops.',
              topic_diversity: 'Moderate: tends to batch related topics in sprints.',
            },
            engagement_score: 0.71,
            engagement_level: 'medium',
            recommendations: [
              {
                category: 'Routine',
                suggestion: 'Add a 5-minute daily review to prime the next session.',
                impact: 'high',
              },
              {
                category: 'Focus',
                suggestion: 'Use 50/10 cycles and end sessions with a written next step.',
                impact: 'medium',
              },
            ],
            next_steps: ['Pick one focus ritual to trial for 7 days.', 'Reduce topic switches to <2/day.'],
          }),
        })
        return
      }

      await route.fulfill({
        status: 404,
        headers: corsHeaders(),
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Not found' }),
      })
    })

    await page.goto('/personalization')

    await expect(page.getByRole('heading', { name: 'Personalization' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Learning Style Detection' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Difficulty Calibration' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Learning Path Generator' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Behavior Insights' })).toBeVisible()

    await page.getByRole('button', { name: /^Detect style$/i }).click()
    const learningStyleRegion = page.getByRole('region', { name: 'Learning Style Detection' })
    await expect(learningStyleRegion.getByText('Detected: Visual')).toBeVisible()

    await page.getByLabel('Calibration topic').fill('Linear algebra')
    await page.getByRole('button', { name: /^Calibrate$/i }).click()
    const difficultyRegion = page.getByRole('region', { name: 'Difficulty Calibration' })
    await expect(difficultyRegion.getByText(/Intermediate/i)).toBeVisible()
    expect(lastDifficultyBody).toEqual({ topic: 'Linear algebra' })

    await page.getByLabel('Learning topic').fill('Neural networks')
    await page.getByLabel('Target level').selectOption('advanced')
    await page.getByRole('button', { name: /Generate path/i }).click()
    await expect(page.getByText('Foundations refresher')).toBeVisible()
    expect(lastLearningPathBody).toEqual({ topic: 'Neural networks', target_level: 'advanced' })

    await page.getByRole('button', { name: /Refresh insights/i }).click()
    await expect(page.getByText(/Deep focus/i)).toBeVisible()
  })
})
