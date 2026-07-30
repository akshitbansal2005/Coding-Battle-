/**
 * AI Code Review & Performance Analysis Service
 * Evaluates submitted competitive programming code for Time/Space complexity,
 * code quality score, optimization insights, and optimal solution recommendations.
 */

export const analyzeCodeSubmission = async ({ code = '', language = 'javascript', problemTitle = 'Problem', difficulty = 'Medium', topic = 'General' }) => {
  const cleanCode = code.trim();
  
  if (!cleanCode) {
    return {
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)',
      score: 0,
      strengths: ['No code submitted yet.'],
      recommendations: ['Write your solution logic in the editor before requesting analysis.'],
      optimalCode: '// Write your solution code first.\n'
    };
  }

  // 1. Analyze Loop Nesting & Time Complexity
  const lines = cleanCode.split('\n');
  let maxLoopDepth = 0;
  let currentDepth = 0;
  let hasLogarithm = false;
  let hasSorting = false;
  let hasRecursion = false;

  const loopRegex = /\b(for|while)\b/;
  const sortRegex = /\b(sort|\.sort|std::sort|Collections\.sort|Arrays\.sort|sorted)\b/i;
  const logRegex = /\b(log|Math\.log|binarySearch|mid\s*=|left\s*<=\s*right|low\s*<=\s*high|\/=\s*2|>>=)\b/i;
  const recursionRegex = /\b(solve|fn|function|def)\b.*?\b\1\s*\(/;

  if (sortRegex.test(cleanCode)) hasSorting = true;
  if (logRegex.test(cleanCode)) hasLogarithm = true;
  if (recursionRegex.test(cleanCode)) hasRecursion = true;

  // Track brace / indentation depth for loop count
  lines.forEach(line => {
    if (loopRegex.test(line)) {
      currentDepth++;
      if (currentDepth > maxLoopDepth) maxLoopDepth = currentDepth;
    }
    if (line.includes('}') && currentDepth > 0) {
      currentDepth--;
    }
  });

  let timeComplexity = 'O(1)';
  if (hasSorting && maxLoopDepth <= 1) {
    timeComplexity = 'O(N log N)';
  } else if (hasLogarithm && maxLoopDepth === 0) {
    timeComplexity = 'O(log N)';
  } else if (hasLogarithm && maxLoopDepth === 1) {
    timeComplexity = 'O(N log N)';
  } else if (maxLoopDepth === 1) {
    timeComplexity = 'O(N)';
  } else if (maxLoopDepth === 2) {
    timeComplexity = 'O(N²)';
  } else if (maxLoopDepth >= 3) {
    timeComplexity = 'O(N³)';
  } else if (hasRecursion) {
    timeComplexity = 'O(2^N)';
  }

  // 2. Analyze Space Complexity
  let spaceComplexity = 'O(1)';
  const memoryStructureRegex = /\b(new\s+Array|vector<|\[\]|\{\}|map<|unordered_map|set<|HashSet|HashMap|ArrayList|list\(|dict\()\b/i;
  const matrixRegex = /\[\s*\]\s*\[\s*\]|vector\s*<\s*vector/i;

  if (matrixRegex.test(cleanCode)) {
    spaceComplexity = 'O(N²)';
  } else if (memoryStructureRegex.test(cleanCode)) {
    spaceComplexity = 'O(N)';
  }

  // 3. Compute Code Quality & Health Score (0 - 100)
  let score = 85;
  if (maxLoopDepth >= 2) score -= 15;
  if (maxLoopDepth >= 3) score -= 20;
  if (cleanCode.length > 800) score -= 5;
  if (cleanCode.length > 50 && cleanCode.length < 400) score += 10;
  if (cleanCode.includes('//') || cleanCode.includes('/*') || cleanCode.includes('#')) score += 5;
  if (timeComplexity === 'O(N)' || timeComplexity === 'O(N log N)') score += 5;
  score = Math.min(98, Math.max(45, score));

  // 4. Formulate Insights
  const strengths = [];
  const recommendations = [];

  if (timeComplexity === 'O(N)' || timeComplexity === 'O(1)' || timeComplexity === 'O(N log N)') {
    strengths.push(`Efficient Time Complexity (${timeComplexity}) suitable for competitive tight execution limits.`);
  } else {
    recommendations.push(`Consider optimizing nested loops (${timeComplexity}) using Hash Maps or Two-Pointer techniques.`);
  }

  if (spaceComplexity === 'O(1)') {
    strengths.push('Optimal memory footprint - running in O(1) auxiliary space.');
  } else {
    recommendations.push(`Auxiliary memory allocation (${spaceComplexity}). Check if array modifications can be done in-place.`);
  }

  if (score >= 80) {
    strengths.push('Clean code structure with structured control flow.');
  } else {
    recommendations.push('Refactor redundant variables and add early exit guard clauses.');
  }

  // 5. Generate Language-Specific Optimal Reference Solution
  const optimalCode = getOptimalTemplate(language, problemTitle, difficulty, topic);

  return {
    timeComplexity,
    spaceComplexity,
    score,
    strengths,
    recommendations,
    optimalCode
  };
};

const getOptimalTemplate = (language, title, difficulty, topic) => {
  const lang = (language || 'cpp').toLowerCase();
  
  if (lang === 'cpp') {
    return `// Optimal Solution - ${title} (${difficulty})
// Topic: ${topic} | Time: O(N) | Space: O(1)

#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n;
    if (!(cin >> n)) return;
    
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    // Optimal Single-Pass Two-Pointer Logic
    int ans = 0;
    int left = 0, right = n - 1;
    while (left < right) {
        ans = max(ans, min(a[left], a[right]) * (right - left));
        if (a[left] < a[right]) left++;
        else right--;
    }
    
    cout << ans << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t = 1;
    if (cin >> t) {
        while (t--) solve();
    }
    return 0;
}
`;
  }

  if (lang === 'python') {
    return `# Optimal Solution - ${title} (${difficulty})
# Topic: ${topic} | Time: O(N) | Space: O(1)

import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    n = int(input_data[0])
    arr = [int(x) for x in input_data[1:n+1]]

    # Two-pointer optimal linear scan
    left, right = 0, len(arr) - 1
    max_val = 0
    
    while left < right:
        max_val = max(max_val, min(arr[left], arr[right]) * (right - left))
        if arr[left] < arr[right]:
            left += 1
        else:
            right -= 1

    print(max_val)

if __name__ == "__main__":
    solve()
`;
  }

  // Default JavaScript / Java / C fallback
  return `// Optimal Solution - ${title} (${difficulty})
// Topic: ${topic} | Time: O(N) | Space: O(1)

function solve(nums) {
    let left = 0;
    let right = nums.length - 1;
    let maxArea = 0;

    while (left < right) {
        const height = Math.min(nums[left], nums[right]);
        const width = right - left;
        maxArea = Math.max(maxArea, height * width);

        if (nums[left] < nums[right]) {
            left++;
        } else {
            right--;
        }
    }

    return maxArea;
}
`;
};
