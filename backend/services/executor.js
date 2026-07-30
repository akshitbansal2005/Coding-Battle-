import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Put temp runs folder at the root level of backend or services
const tempDir = path.join(__dirname, '..', 'temp_runs');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Runs user code against a set of input strings.
 * @param {string} code - The user's code content.
 * @param {string} language - 'javascript' or 'python'.
 * @param {Array<{input: string, output: string}>} testCases - List of test cases to run.
 * @returns {Promise<{success: boolean, passedCount: number, totalCount: number, results: Array}>}
 */
export const executeCode = async (code, language, testCases) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const ext = language === 'javascript' ? 'js' : 'py';
  const fileName = `run_${timestamp}_${randomId}.${ext}`;
  const filePath = path.join(tempDir, fileName);

  // Write code to temp file
  fs.writeFileSync(filePath, code);

  const results = [];
  let passedCount = 0;

  try {
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const runResult = await runSingleTestCase(filePath, language, tc.input, tc.output);
      results.push({
        testCaseIndex: i,
        input: tc.input,
        expectedOutput: tc.output.trim(),
        actualOutput: runResult.stdout.trim(),
        error: runResult.error,
        stderr: runResult.stderr,
        status: runResult.status, // 'Passed', 'Failed', 'Error', 'Time Limit Exceeded'
        timeMs: runResult.timeMs
      });

      if (runResult.status === 'Passed') {
        passedCount++;
      }
    }

    return {
      success: passedCount === testCases.length,
      passedCount,
      totalCount: testCases.length,
      results
    };
  } finally {
    // Cleanup file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Failed to cleanup temp file:', err);
    }
  }
};

const runSingleTestCase = (filePath, language, input, expectedOutput) => {
  return new Promise((resolve) => {
    let cmd = 'node';
    let args = [filePath];

    if (language === 'python') {
      cmd = process.platform === 'win32' ? 'python' : 'python3';
      args = [filePath];
    }

    const start = process.hrtime();
    const child = spawn(cmd, args);

    let stdout = '';
    let stderr = '';
    let isFinished = false;

    const timeoutLimit = 3000;
    const timeout = setTimeout(() => {
      if (!isFinished) {
        isFinished = true;
        child.kill('SIGKILL');
        const diff = process.hrtime(start);
        const timeMs = Math.round(diff[0] * 1000 + diff[1] / 1000000);
        resolve({
          stdout,
          stderr: 'Time Limit Exceeded (3000ms limit)',
          status: 'Time Limit Exceeded',
          error: true,
          timeMs
        });
      }
    }, timeoutLimit);

    child.stdin.write(input);
    child.stdin.end();

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timeout);
      const diff = process.hrtime(start);
      const timeMs = Math.round(diff[0] * 1000 + diff[1] / 1000000);
      
      let errorMsg = err.message;
      if (err.code === 'ENOENT') {
        errorMsg = language === 'python' 
          ? 'Python runtime not found. Please install Python or use JavaScript.' 
          : 'Node runtime not found.';
      }
      
      resolve({
        stdout,
        stderr: errorMsg,
        status: 'Error',
        error: true,
        timeMs
      });
    });

    child.on('close', (code) => {
      if (isFinished) return;
      isFinished = true;
      clearTimeout(timeout);
      const diff = process.hrtime(start);
      const timeMs = Math.round(diff[0] * 1000 + diff[1] / 1000000);

      if (code !== 0) {
        resolve({
          stdout,
          stderr: stderr || `Process exited with code ${code}`,
          status: 'Error',
          error: true,
          timeMs
        });
      } else {
        const passed = stdout.trim() === expectedOutput.trim();
        resolve({
          stdout,
          stderr,
          status: passed ? 'Passed' : 'Failed',
          error: !passed,
          timeMs
        });
      }
    });
  });
};
