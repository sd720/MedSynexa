import { Request, Response } from 'express';
import { queryDocumentChunks } from '../services/pgvectorService';
import { getQueryEmbedding, runClinicalCopilotChain } from '../services/langchainService';
import { ClinicalSession } from '../models/ClinicalSession';

export const analyzeClinicalCase = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    const { chiefComplaint, symptoms, age, gender } = req.body;

    if (!doctorId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!chiefComplaint) {
      res.status(400).json({ message: 'chiefComplaint is required' });
      return;
    }

    console.log(`🩺 Analyzing Clinical Case for OPD Copilot...`);

    // Build a query for vector search based on patient presentation
    const symptomsStr = symptoms && Array.isArray(symptoms) ? symptoms.join(' ') : '';
    const queryText = `${chiefComplaint} ${symptomsStr}`.trim();

    // 1. Get embedding for the query
    const queryEmbedding = await getQueryEmbedding(queryText);

    // 2. Search for relevant context across ALL textbooks uploaded by the doctor
    // (We omit documentId and documentType to search everything for maximum context)
    const matches = await queryDocumentChunks(doctorId, queryEmbedding, 15, {
      queryText,
    });

    if (matches && matches.length > 0) {
      console.log(`📚 Found ${matches.length} relevant textbook chunks for context.`);
    } else {
      console.log(`⚠️ No relevant textbook chunks found. AI will rely on general knowledge.`);
    }

    // 3. Run the Clinical Copilot Chain, injecting the retrieved textbook context
    const startTime = Date.now();
    const output = await runClinicalCopilotChain(req.body, matches || []);
    const responseTimeMs = Date.now() - startTime;

    // Attach response time for UI
    const finalOutput = {
      ...output,
      responseTimeMs,
    };

    // Save session to history
    const session = new ClinicalSession({
      userId: doctorId,
      input: req.body,
      output: finalOutput,
    });
    await session.save();

    res.status(200).json({
      message: 'Analysis complete',
      output: finalOutput,
      sessionId: session._id,
    });
  } catch (error: any) {
    console.error('Error during clinical case analysis:', error);
    res.status(500).json({
      message: 'Failed to analyze clinical case.',
      error: error.message,
    });
  }
};

export const getClinicalSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const sessions = await ClinicalSession.find({ userId: doctorId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ sessions });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: error.message });
  }
};

export const deleteClinicalSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    const { id } = req.params;

    if (!doctorId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const session = await ClinicalSession.findOneAndDelete({ _id: id, userId: doctorId });
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    res.status(200).json({ message: 'Clinical session deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete session', error: error.message });
  }
};

export const signOffClinicalSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctorId = req.user?.id;
    const { id } = req.params;

    if (!doctorId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const session = await ClinicalSession.findOneAndUpdate(
      { _id: id, userId: doctorId },
      {
        status: 'verified_by_physician',
        physicianSignedOff: true,
        signedOffAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    res.status(200).json({
      message: 'Physician sign-off recorded successfully in EHR.',
      session,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to sign off clinical session', error: error.message });
  }
};

