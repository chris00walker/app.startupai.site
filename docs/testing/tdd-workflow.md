---
purpose: "Test-Driven Development workflow and methodology"
status: "active"
last_reviewed: "2026-01-19"
---

# Test-Driven Development Workflow

A practical guide to TDD in the StartupAI codebase.

## Why TDD?

**TDD is not about testing. It's about design.**

Benefits:
- **Confidence**: Tests prove code works before shipping
- **Design**: Writing tests first forces clear interfaces
- **Documentation**: Tests show how code should be used
- **Refactoring**: Safe to improve code when tests pass
- **Speed**: Fewer bugs in production means faster overall delivery

## The Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│    ┌───────┐      ┌───────┐      ┌──────────┐     │
│    │  RED  │ ───► │ GREEN │ ───► │ REFACTOR │     │
│    └───────┘      └───────┘      └──────────┘     │
│        │                              │            │
│        └──────────────────────────────┘            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1. RED: Write a Failing Test

Write a test that describes the behavior you want. Run it. **It must fail.**

If the test passes before you write code, either:
- The feature already exists
- Your test is wrong

```typescript
// ❌ Test fails - function doesn't exist yet
it('should calculate project completion percentage', () => {
  const project = { stages: [true, true, false, false, false, false, false] };
  expect(calculateCompletion(project)).toBe(28.57);
});
```

### 2. GREEN: Make the Test Pass

Write the **minimum code** necessary to make the test pass. Don't over-engineer.

```typescript
// ✅ Minimal implementation
function calculateCompletion(project: { stages: boolean[] }): number {
  const completed = project.stages.filter(Boolean).length;
  return Math.round((completed / project.stages.length) * 10000) / 100;
}
```

### 3. REFACTOR: Clean Up

Now that tests are green, improve the code. Run tests after each change.

```typescript
// ✅ Refactored - extracted constant, improved naming
const TOTAL_STAGES = 7;

function calculateProjectCompletion(project: Project): number {
  const completedStages = project.stages.filter(stage => stage.isComplete).length;
  const percentage = (completedStages / TOTAL_STAGES) * 100;
  return Math.round(percentage * 100) / 100;
}
```

## TDD Workflow in Practice

### Step 1: Start with a User Story

Before writing any code, find or create the user story in [`user-stories.md`](../user-experience/user-stories.md).

**Example: US-F04 "Archive Project"**

```markdown
**As a** Founder
**I want to** archive a project
**So that** I can hide it from my active dashboard without deleting data

**Acceptance Criteria:**
- [ ] Can archive from project settings
- [ ] Archived projects hidden from main dashboard
- [ ] Can view archived projects separately
- [ ] Can restore archived projects
```

### Step 2: Write the Test First

Create a test file for the feature:

```typescript
// src/__tests__/hooks/useProjectArchive.test.ts

describe('useProjectArchive', () => {
  describe('archiveProject', () => {
    it('should mark project as archived', async () => {
      // Arrange
      const projectId = 'test-project-123';
      const { result } = renderHook(() => useProjectArchive());

      // Act
      await result.current.archiveProject(projectId);

      // Assert
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ archived_at: expect.any(Date) })
      );
    });

    it('should remove project from active list', async () => {
      const projectId = 'test-project-123';
      const { result } = renderHook(() => useProjects());

      await act(async () => {
        await result.current.archiveProject(projectId);
      });

      expect(result.current.activeProjects).not.toContainEqual(
        expect.objectContaining({ id: projectId })
      );
    });
  });
});
```

### Step 3: Run the Test (Expect Failure)

```bash
pnpm test -- useProjectArchive.test.ts
```

**Expected output:**
```
FAIL  src/__tests__/hooks/useProjectArchive.test.ts
  ● useProjectArchive › archiveProject › should mark project as archived
    TypeError: Cannot read property 'archiveProject' of undefined
```

### Step 4: Implement Minimum Code

```typescript
// src/hooks/useProjectArchive.ts

export function useProjectArchive() {
  const supabase = useSupabaseClient();

  const archiveProject = async (projectId: string) => {
    await supabase
      .from('projects')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', projectId);
  };

  return { archiveProject };
}
```

### Step 5: Run Test Again (Expect Pass)

```bash
pnpm test -- useProjectArchive.test.ts
```

**Expected output:**
```
PASS  src/__tests__/hooks/useProjectArchive.test.ts
  ✓ should mark project as archived (23 ms)
```

### Step 6: Add More Tests, Repeat

Continue adding tests for edge cases:

```typescript
it('should throw error if project not found', async () => {
  mockSupabase.update.mockRejectedValue(new Error('Not found'));

  await expect(result.current.archiveProject('invalid-id'))
    .rejects.toThrow('Not found');
});

it('should not archive already archived project', async () => {
  const alreadyArchived = { id: '123', archived_at: '2026-01-01' };

  await expect(result.current.archiveProject(alreadyArchived.id))
    .rejects.toThrow('Project already archived');
});
```

## Journey-Driven Test Development (JDTD)

JDTD extends TDD by deriving tests from user journeys instead of code structure.

### Traditional TDD (Code-Driven)

```
Code Structure → Test Cases
```

**Problem:** Tests verify implementation details, not user outcomes.

### JDTD (Journey-Driven)

```
User Journey → User Goal → Acceptance Criteria → Test Cases → Implementation
```

**Benefit:** Tests verify that users can accomplish their goals.

### JDTD Workflow

1. **Find the Journey Step**

   From [`founder-journey-map.md`](../user-experience/founder-journey-map.md):
   ```
   Step 5: Quick Start Form
   - user_goal: "Submit business idea for validation"
   - success_metrics: "Submission rate > 95%"
   ```

2. **Map to User Story**

   From [`user-stories.md`](../user-experience/user-stories.md):
   ```
   US-F01: Complete Quick Start Onboarding
   - Acceptance: User submits Quick Start form
   - Acceptance: Phase 1 starts automatically
   ```

3. **Write E2E Test**

   ```typescript
   // tests/e2e/02-onboarding-flow.spec.ts

   test('user completes Quick Start onboarding', async ({ page }) => {
     // Arrange
     await loginAsFounder(page);
     await page.goto('/onboarding/quick-start');

     // Act - submit Quick Start form
     await page.fill('[data-testid="business-idea-input"]', 'AI-powered startup validation platform');
     await page.click('[data-testid="start-validation-button"]');

     // Assert - Phase 1 starts
     await expect(page.locator('[data-testid="phase-1-started"]')).toBeVisible();
   });
   ```

4. **Write Unit Tests for Components**

   ```typescript
   // src/components/onboarding/__tests__/StageProgress.test.tsx

   it('shows correct completion percentage', () => {
     render(<StageProgress currentStage={3} totalStages={7} />);
     expect(screen.getByText('43%')).toBeInTheDocument();
   });
   ```

5. **Implement Feature**

### Coverage Matrix

Check [`journey-test-matrix.md`](./journey-test-matrix.md) to ensure stories have test coverage:

| Story | E2E | Unit | Status |
|-------|-----|------|--------|
| US-F01 | ✅ | ✅ | Covered |
| US-F04 | ❌ | ❌ | **Gap** |

## Practical Examples

### Example 1: Testing a React Hook

**Story:** US-F07 "Resume Conversation"

```typescript
// 1. Write failing test
describe('useOnboardingSession', () => {
  it('should resume existing session on mount', async () => {
    const existingSession = { id: '123', stage: 3, messages: [...] };
    mockSupabase.select.mockResolvedValue({ data: existingSession });

    const { result, waitForNextUpdate } = renderHook(() => useOnboardingSession());
    await waitForNextUpdate();

    expect(result.current.session).toEqual(existingSession);
    expect(result.current.isResuming).toBe(true);
  });
});

// 2. Implement hook
export function useOnboardingSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase
        .from('onboarding_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        setSession(data);
        setIsResuming(true);
      }
    }
    loadSession();
  }, [userId]);

  return { session, isResuming };
}
```

### Example 2: Testing an API Route

**Story:** US-C02 "Invite Client"

```typescript
// 1. Write failing test
describe('POST /api/clients/invite', () => {
  it('should create invite and send email', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { email: 'client@example.com', projectId: '123' }
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.invite).toHaveProperty('token');
    expect(mockEmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'client@example.com' })
    );
  });

  it('should reject duplicate invites', async () => {
    mockSupabase.select.mockResolvedValue({ data: [{ email: 'client@example.com' }] });

    const req = createMockRequest({
      method: 'POST',
      body: { email: 'client@example.com', projectId: '123' }
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });
});

// 2. Implement route
export async function POST(req: NextRequest) {
  const { email, projectId } = await req.json();

  // Check for existing invite
  const { data: existing } = await supabase
    .from('client_invites')
    .select('*')
    .eq('email', email)
    .eq('project_id', projectId);

  if (existing?.length) {
    return NextResponse.json({ error: 'Invite already sent' }, { status: 409 });
  }

  // Create invite
  const token = generateToken();
  const { data: invite } = await supabase
    .from('client_invites')
    .insert({ email, project_id: projectId, token })
    .select()
    .single();

  // Send email
  await emailService.send({
    to: email,
    template: 'client-invite',
    data: { token, projectId }
  });

  return NextResponse.json({ invite }, { status: 201 });
}
```

### Example 3: Testing a Component

**Story:** US-F03 "Review HITL Checkpoint"

```typescript
// 1. Write failing test
describe('ApprovalCard', () => {
  it('displays approval details correctly', () => {
    const approval = {
      id: '123',
      type: 'founders_brief',
      status: 'pending',
      created_at: '2026-01-19T10:00:00Z'
    };

    render(<ApprovalCard approval={approval} />);

    expect(screen.getByText("Founder's Brief Review")).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review/i })).toBeEnabled();
  });

  it('calls onApprove when approved', async () => {
    const onApprove = jest.fn();
    render(<ApprovalCard approval={mockApproval} onApprove={onApprove} />);

    await userEvent.click(screen.getByRole('button', { name: /approve/i }));

    expect(onApprove).toHaveBeenCalledWith(mockApproval.id);
  });
});

// 2. Implement component
export function ApprovalCard({ approval, onApprove }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatApprovalType(approval.type)}</CardTitle>
        <Badge>{approval.status}</Badge>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => onApprove(approval.id)}>
          Approve
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## TDD Anti-Patterns to Avoid

### 1. Testing Implementation, Not Behavior

```typescript
// ❌ Bad - tests implementation details
it('should call setState with new value', () => {
  const setState = jest.spyOn(React, 'useState');
  // ...
  expect(setState).toHaveBeenCalledWith('new value');
});

// ✅ Good - tests observable behavior
it('should display updated value', () => {
  render(<Counter />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

### 2. Writing Tests After Implementation

```typescript
// ❌ Bad - retrofitting tests to existing code
function processData(data) {
  // 100 lines of complex logic already written
}

// Then writing tests that just verify current behavior
it('should return 42', () => {
  expect(processData(input)).toBe(42); // Why 42? Because that's what it does.
});

// ✅ Good - test defines expected behavior FIRST
it('should calculate average of all values', () => {
  expect(processData([10, 20, 30])).toBe(20);
});
```

### 3. Overly Specific Mocks

```typescript
// ❌ Bad - mock is too specific
mockFetch.mockResolvedValueOnce({
  json: () => Promise.resolve({ id: 1, name: 'Test', createdAt: '2026-01-19' })
});

// ✅ Good - mock only what's needed
mockFetch.mockResolvedValueOnce({
  json: () => Promise.resolve({ id: expect.any(Number), name: 'Test' })
});
```

### 4. Testing Third-Party Code

```typescript
// ❌ Bad - testing Supabase's behavior
it('should return data from supabase', () => {
  expect(supabase.from('users').select()).resolves.toHaveProperty('data');
});

// ✅ Good - test YOUR code's handling of results
it('should map user data to UserProfile type', () => {
  const rawData = { id: '1', full_name: 'Test User' };
  expect(mapToUserProfile(rawData)).toEqual({
    id: '1',
    name: 'Test User',
    initials: 'TU'
  });
});
```

## TDD Checklist

Before starting any feature:

- [ ] User story exists in `user-stories.md`
- [ ] Acceptance criteria are clear
- [ ] Test file created
- [ ] First failing test written
- [ ] Test actually fails (ran `pnpm test`)

During implementation:

- [ ] Each test written before its implementation
- [ ] Tests are green before moving on
- [ ] Refactoring done with green tests

After implementation:

- [ ] All tests pass
- [ ] Edge cases covered
- [ ] Error cases covered
- [ ] Journey test matrix updated if applicable

## Quick Reference

### Start TDD Session

```bash
# Start watch mode
pnpm test:watch

# Or for specific file
pnpm test:watch -- ComponentName
```

### Common Jest Patterns

```typescript
// Setup/teardown
beforeEach(() => { /* reset mocks */ });
afterEach(() => { cleanup(); });

// Async testing
await waitFor(() => expect(element).toBeVisible());

// Mock functions
const mockFn = jest.fn().mockResolvedValue(data);

// Snapshot testing (use sparingly)
expect(component).toMatchSnapshot();
```

### Test File Location Convention

| Type | Location |
|------|----------|
| Hook tests | `src/__tests__/hooks/useXxx.test.ts` |
| Component tests | `src/components/Xxx/__tests__/Xxx.test.tsx` |
| API route tests | `src/__tests__/api/route-name.test.ts` |
| Integration tests | `src/__tests__/integration/feature.test.ts` |
| E2E tests | `tests/e2e/NN-feature.spec.ts` |

## Resources

- [Kent C. Dodds - Testing JavaScript](https://testingjavascript.com/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)

---

**Last Updated**: 2026-01-19
**Maintainer**: Engineering Team
