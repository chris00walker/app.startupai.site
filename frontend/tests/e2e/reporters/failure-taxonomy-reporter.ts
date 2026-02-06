import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestError,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

type FailureClass =
  | 'NO_TESTS_MATCHED'
  | 'SERVER_START_TIMEOUT'
  | 'GLOBAL_SETUP_TIMEOUT'
  | 'ASSERTION_FAILURE'
  | 'EXTERNAL_INFRA_FAILURE';

const FAILURE_CLASS_ORDER: FailureClass[] = [
  'NO_TESTS_MATCHED',
  'SERVER_START_TIMEOUT',
  'GLOBAL_SETUP_TIMEOUT',
  'EXTERNAL_INFRA_FAILURE',
  'ASSERTION_FAILURE',
];

const CLASS_TAG = /\[E2E_CLASS=([A-Z_]+)\]/;

function parseTaggedClass(message: string): FailureClass | null {
  const match = CLASS_TAG.exec(message);
  if (!match) return null;
  const candidate = match[1] as FailureClass;
  return FAILURE_CLASS_ORDER.includes(candidate) ? candidate : null;
}

function classifyErrorMessage(message: string): FailureClass {
  const tagged = parseTaggedClass(message);
  if (tagged) return tagged;

  const lower = message.toLowerCase();
  if (lower.includes('did not match any tests') || lower.includes('no tests found')) {
    return 'NO_TESTS_MATCHED';
  }
  if (
    lower.includes('timed out waiting') &&
    (lower.includes('webserver') ||
      lower.includes('localhost') ||
      lower.includes('/api/health'))
  ) {
    return 'SERVER_START_TIMEOUT';
  }
  if (lower.includes('global setup') && lower.includes('timeout')) {
    return 'GLOBAL_SETUP_TIMEOUT';
  }
  if (
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('socket hang up') ||
    lower.includes('network')
  ) {
    return 'EXTERNAL_INFRA_FAILURE';
  }
  return 'ASSERTION_FAILURE';
}

class FailureTaxonomyReporter implements Reporter {
  private totalTests = 0;
  private failureClasses = new Set<FailureClass>();

  onBegin(_config: FullConfig, suite: Suite): void {
    this.totalTests = suite.allTests().length;
  }

  onError(error: TestError): void {
    this.collectFromError(error);
  }

  onTestEnd(_test: TestCase, result: TestResult): void {
    if (result.status !== 'failed' && result.status !== 'timedOut') {
      return;
    }

    if (result.error) {
      this.collectFromError(result.error);
    }
    for (const err of result.errors) {
      this.collectFromError(err);
    }
  }

  onEnd(result: FullResult): void {
    if (result.status === 'passed') {
      return;
    }

    if (this.totalTests === 0) {
      this.failureClasses.add('NO_TESTS_MATCHED');
    }
    if (this.failureClasses.size === 0) {
      this.failureClasses.add('ASSERTION_FAILURE');
    }

    const ordered = [...this.failureClasses].sort(
      (a, b) => FAILURE_CLASS_ORDER.indexOf(a) - FAILURE_CLASS_ORDER.indexOf(b)
    );
    const primary = ordered[0];

    console.error('');
    console.error('[E2E Failure Taxonomy]');
    console.error(`Primary: ${primary}`);
    console.error(`All: ${ordered.join(', ')}`);
  }

  private collectFromError(error: TestError): void {
    const message = `${error.message || ''}\n${error.stack || ''}`.trim();
    if (!message) return;
    this.failureClasses.add(classifyErrorMessage(message));
  }
}

export default FailureTaxonomyReporter;
