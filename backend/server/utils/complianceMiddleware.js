import ComplianceAgent from '../../agents/crossCutting/complianceAgent.js';

/**
 * Express middleware to scan and redact PII from request bodies.
 */
export async function redactPIIMiddleware(req, _res, next) {
  if (req.body && Object.keys(req.body).length > 0) {
    try {
      const complianceAgent = new ComplianceAgent();
      await complianceAgent.initialize();
      const result = await complianceAgent.checkCompliance({ clientId: req.body.clientId, content: req.body });
      if (result?.content) {
        req.body = result.content;
      }
    } catch (err) {
      console.error('PII redaction failed', err);
    }
  }
  next();
}
