import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

export const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create Problems Table
      db.run(`
        CREATE TABLE IF NOT EXISTS problems (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          platform TEXT NOT NULL,
          difficulty TEXT NOT NULL,
          description TEXT NOT NULL,
          input_format TEXT NOT NULL,
          output_format TEXT NOT NULL,
          constraints TEXT NOT NULL,
          sample_cases TEXT NOT NULL, -- JSON string of [{input, output, explanation}]
          test_cases TEXT NOT NULL,   -- JSON string of [{input, output}]
          starter_javascript TEXT NOT NULL,
          starter_python TEXT NOT NULL
        )
      `, (err) => {
        if (err) return reject(err);
      });

      // Create Matches Table
      db.run(`
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY,
          player1_id TEXT NOT NULL,
          player2_id TEXT NOT NULL,
          winner_id TEXT,
          problem_id INTEGER,
          duration INTEGER, -- in seconds
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (problem_id) REFERENCES problems(id)
        )
      `, (err) => {
        if (err) return reject(err);
        
        // After tables are created, check if we need to seed problems
        seedProblems().then(resolve).catch(reject);
      });
    });
  });
};

const seedProblems = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM problems', (err, row) => {
      if (err) return reject(err);
      if (row.count > 0) {
        console.log('Database already seeded.');
        return resolve();
      }

      console.log('Seeding initial problems...');

      const problems = [
        {
          title: "Watermelon",
          platform: "Codeforces",
          difficulty: "Easy",
          description: "One hot summer day Pete and his friend Billy decided to buy a watermelon. They chose the biggest and the ripest one, in their opinion. After that the watermelon was weighed, and the scales showed w kilos. They rushed home, dying of thirst, and decided to divide the berry, however they faced a hard problem.\n\nPete and Billy are great fans of even numbers, that's why they want to divide the watermelon in such a way that each of the two parts weighs even number of kilos, at the same time it is not obligatory that the parts are equal. The boys are extremely tired and want to start their meal as soon as possible, that's why you should help them and find out, if they can divide the watermelon in the way they want. For sure, each of them should get a part of positive weight.",
          input_format: "The first (and the only) input line contains integer number w (1 <= w <= 100) — the weight of the watermelon bought by the boys.",
          output_format: "Print YES, if the boys can divide the watermelon into two parts, each of them weighing even number of kilos; and NO in the opposite case.",
          constraints: "1 <= w <= 100",
          sample_cases: JSON.stringify([
            { input: "8", output: "YES", explanation: "For example, the watermelon can be divided into two parts of 2 and 6 kilos respectively (both numbers are even and positive)." },
            { input: "2", output: "NO", explanation: "The only division is 1 and 1, which are odd numbers." }
          ]),
          test_cases: JSON.stringify([
            { input: "8", output: "YES" },
            { input: "2", output: "NO" },
            { input: "1", output: "NO" },
            { input: "10", output: "YES" },
            { input: "12", output: "YES" },
            { input: "99", output: "NO" },
            { input: "100", output: "YES" }
          ]),
          starter_javascript: `// Read input from stdin and print output to stdout
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const w = parseInt(line.trim());
    // Write your code here
    if (w > 2 && w % 2 === 0) {
        console.log("YES");
    } else {
        console.log("NO");
    }
});`,
          starter_python: `# Read input from stdin and print output to stdout
import sys

def solve():
    line = sys.stdin.readline().strip()
    if not line:
        return
    w = int(line)
    # Write your code here
    if w > 2 and w % 2 == 0:
        print("YES")
    else:
        print("NO")

if __name__ == '__main__':
    solve()`
        },
        {
          title: "Way Too Long Words",
          platform: "Codeforces",
          difficulty: "Easy",
          description: "Sometimes some words like 'localization' or 'internationalization' are so long that writing them many times in one text is quite tiresome.\n\nLet's consider a word too long, if its length is strictly more than 10 characters. All too long words should be replaced with a special abbreviation.\n\nThis abbreviation is made like this: we write down the first and the last letter of a word and between them we write the number of characters between the first and the last letters. That number is in decimal system and doesn't contain leading zeroes.\n\nThus, 'localization' will be spelt as 'l10n', and 'internationalization' will be spelt as 'i18n'.\n\nYou are suggested to automatize the process of changing the words with abbreviations. All too long words should be replaced by the abbreviation and the words that are not too long should not undergo any changes.",
          input_format: "The first line contains an integer n (1 <= n <= 100). Each of the following n lines contains one word. All the words consist of lowercase Latin letters and possess lengths from 1 to 100 characters.",
          output_format: "Print n lines. The i-th line should contain the result of replacing of the i-th word from the input data.",
          constraints: "1 <= n <= 100\nLength of word: 1 to 100 letters",
          sample_cases: JSON.stringify([
            { input: "4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis", output: "word\nl10n\ni18n\np43s", explanation: "Only words longer than 10 characters are abbreviated." }
          ]),
          test_cases: JSON.stringify([
            { input: "4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis", output: "word\nl10n\ni18n\np43s" },
            { input: "1\na", output: "a" },
            { input: "2\nsupercalifragilisticexpialidocious\nabcdefghijk", output: "s32s\na9k" }
          ]),
          starter_javascript: `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let lines = [];
rl.on('line', (line) => {
    lines.push(line.trim());
});

rl.on('close', () => {
    const n = parseInt(lines[0]);
    for (let i = 1; i <= n; i++) {
        const word = lines[i];
        // Write code here to process word and print output
        if (word.length > 10) {
            console.log(word[0] + (word.length - 2) + word[word.length - 1]);
        } else {
            console.log(word);
        }
    }
});`,
          starter_python: `import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    n = int(lines[0])
    for i in range(1, n + 1):
        word = lines[i]
        # Write your code here
        if len(word) > 10:
            print(word[0] + str(len(word) - 2) + word[-1])
        else:
            print(word)

if __name__ == '__main__':
    solve()`
        },
        {
          title: "Two Sum",
          platform: "LeetCode",
          difficulty: "Easy",
          description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
          input_format: "The input contains two lines. The first line contains space-separated integers representing the array nums. The second line contains a single integer representing the target.",
          output_format: "Print the two indices (0-indexed) space-separated in increasing order.",
          constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
          sample_cases: JSON.stringify([
            { input: "2 7 11 15\n9", output: "0 1", explanation: "Because nums[0] + nums[1] == 2 + 7 == 9, we return 0 1." },
            { input: "3 2 4\n6", output: "1 2", explanation: "Because nums[1] + nums[2] == 2 + 4 == 6, we return 1 2." }
          ]),
          test_cases: JSON.stringify([
            { input: "2 7 11 15\n9", output: "0 1" },
            { input: "3 2 4\n6", output: "1 2" },
            { input: "3 3\n6", output: "0 1" },
            { input: "-1 -2 -3 -4 -5\n-8", output: "2 4" }
          ]),
          starter_javascript: `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let lines = [];
rl.on('line', (line) => {
    lines.push(line.trim());
});

rl.on('close', () => {
    const nums = lines[0].split(' ').map(Number);
    const target = parseInt(lines[1]);
    
    // Write your code here to find indices and print them space-separated
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            console.log(map.get(diff) + " " + i);
            return;
        }
        map.set(nums[i], i);
    }
});`,
          starter_python: `import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    
    # Write code here
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    solve()`
        },
        {
          title: "Valid Parentheses",
          platform: "LeetCode",
          difficulty: "Easy",
          description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
          input_format: "A single line containing the string s.",
          output_format: "Print true if the string is valid, otherwise print false.",
          constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
          sample_cases: JSON.stringify([
            { input: "()", output: "true", explanation: "Standard matching pair." },
            { input: "()[]{}", output: "true", explanation: "All closed correctly." },
            { input: "(]", output: "false", explanation: "Mismatching brackets." }
          ]),
          test_cases: JSON.stringify([
            { input: "()", output: "true" },
            { input: "()[]{}", output: "true" },
            { input: "(]", output: "false" },
            { input: "([)]", output: "false" },
            { input: "{[]}", output: "true" },
            { input: "[", output: "false" },
            { input: "]", output: "false" }
          ]),
          starter_javascript: `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const s = line.trim();
    // Write code here and print true/false
    const stack = [];
    const map = {
        ')': '(',
        '}': '{',
        ']': '['
    };
    
    for (let char of s) {
        if (char === '(' || char === '{' || char === '[') {
            stack.push(char);
        } else {
            if (stack.pop() !== map[char]) {
                console.log("false");
                return;
            }
        }
    }
    console.log(stack.length === 0 ? "true" : "false");
});`,
          starter_python: `import sys

def solve():
    s = sys.stdin.readline().strip()
    if not s:
        print("true")
        return
        
    stack = []
    brackets = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in brackets.values():
            stack.append(char)
        elif char in brackets.keys():
            if not stack or stack.pop() != brackets[char]:
                print("false")
                return
        else:
            print("false")
            return
            
    print("true" if not stack else "false")

if __name__ == '__main__':
    solve()`
        },
        {
          title: "Container With Most Water",
          platform: "LeetCode",
          difficulty: "Medium",
          description: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the i-th line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.\n\nNotice that you may not slant the container.",
          input_format: "A single line containing space-separated integers representing the array height.",
          output_format: "Print a single integer representing the maximum volume of water.",
          constraints: "n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4",
          sample_cases: JSON.stringify([
            { input: "1 8 6 2 5 4 8 3 7", output: "49", explanation: "The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49 (between lines at index 1 and index 8, height min(8,7) * width 7)." }
          ]),
          test_cases: JSON.stringify([
            { input: "1 8 6 2 5 4 8 3 7", output: "49" },
            { input: "1 1", output: "1" },
            { input: "4 3 2 1 4", output: "16" },
            { input: "1 2 1", output: "2" }
          ]),
          starter_javascript: `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const height = line.trim().split(' ').map(Number);
    // Write your code here
    let max = 0;
    let l = 0;
    let r = height.length - 1;
    while (l < r) {
        const area = Math.min(height[l], height[r]) * (r - l);
        max = Math.max(max, area);
        if (height[l] < height[r]) {
            l++;
        } else {
            r--;
        }
    }
    console.log(max);
});`,
          starter_python: `import sys

def solve():
    line = sys.stdin.readline().strip()
    if not line:
        return
    height = list(map(int, line.split()))
    
    # Write your code here
    max_area = 0
    l = 0
    r = len(height) - 1
    while l < r:
        area = min(height[l], height[r]) * (r - l)
        max_area = max(max_area, area)
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    print(max_area)

if __name__ == '__main__':
    solve()`
        },
        {
          title: "Theatre Square",
          platform: "Codeforces",
          difficulty: "Medium",
          description: "Theatre Square in the capital city of Berland has a rectangular shape with the size n x m meters. On the occasion of the city's anniversary, a decision was taken to pave the Square with square granite flagstones. Each flagstone is of the size a x a.\n\nWhat is the least number of flagstones needed to pave the Square? It's allowed to pave the larger surface than the Theatre Square, but the Square has to be covered. It's not allowed to break the flagstones. The sides of flagstones should be parallel to the sides of the Square.",
          input_format: "The input contains three space-separated integers on a single line: n, m and a (1 <= n, m, a <= 10^9).",
          output_format: "Print the required number of flagstones.",
          constraints: "1 <= n, m, a <= 10^9",
          sample_cases: JSON.stringify([
            { input: "6 6 4", output: "4", explanation: "We need 2 flagstones along the length and 2 along the width, making it 4 flagstones in total to pave a 6x6 square." }
          ]),
          test_cases: JSON.stringify([
            { input: "6 6 4", output: "4" },
            { input: "1 1 1", output: "1" },
            { input: "1000000000 1000000000 1", output: "1000000000000000000" },
            { input: "12 13 5", output: "9" }
          ]),
          starter_javascript: `const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    const parts = line.trim().split(' ').map(Number);
    if (parts.length < 3) return;
    const n = BigInt(parts[0]);
    const m = BigInt(parts[1]);
    const a = BigInt(parts[2]);
    
    // Write code here using BigInt to support huge outputs!
    const lengthVal = (n + a - 1n) / a;
    const widthVal = (m + a - 1n) / a;
    console.log((lengthVal * widthVal).toString());
});`,
          starter_python: `import sys
import math

def solve():
    line = sys.stdin.readline().strip()
    if not line:
        return
    n, m, a = map(int, line.split())
    # Write code here
    length_val = math.ceil(n / a)
    width_val = math.ceil(m / a)
    print(length_val * width_val)

if __name__ == '__main__':
    solve()`
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO problems (
          title, platform, difficulty, description, input_format, output_format, constraints, sample_cases, test_cases, starter_javascript, starter_python
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      problems.forEach(p => {
        stmt.run(
          p.title,
          p.platform,
          p.difficulty,
          p.description,
          p.input_format,
          p.output_format,
          p.constraints,
          p.sample_cases,
          p.test_cases,
          p.starter_javascript,
          p.starter_python
        );
      });

      stmt.finalize((err) => {
        if (err) return reject(err);
        console.log('Seeded database with initial problems.');
        resolve();
      });
    });
  });
};

export const getProblems = (filters = {}) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT id, title, platform, difficulty, description, input_format, output_format, constraints, sample_cases, starter_javascript, starter_python FROM problems WHERE 1=1';
    const params = [];
    if (filters.difficulty && filters.difficulty !== 'All') {
      query += ' AND difficulty = ?';
      params.push(filters.difficulty);
    }
    if (filters.platform && filters.platform !== 'All') {
      query += ' AND platform = ?';
      params.push(filters.platform);
    }
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getProblemById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM problems WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const saveMatch = (match) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO matches (id, player1_id, player2_id, winner_id, problem_id, duration) VALUES (?, ?, ?, ?, ?, ?)',
      [match.id, match.player1_id, match.player2_id, match.winner_id, match.problem_id, match.duration],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};
