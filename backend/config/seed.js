import Problem from '../models/Problem.js';

const initialProblems = [
  {
    title: "Watermelon",
    platform: "Codeforces",
    difficulty: "Easy",
    description: "One hot summer day Pete and his friend Billy decided to buy a watermelon. They chose the biggest and the ripest one, in their opinion. After that the watermelon was weighed, and the scales showed w kilos. They rushed home, dying of thirst, and decided to divide the berry, however they faced a hard problem.\n\nPete and Billy are great fans of even numbers, that's why they want to divide the watermelon in such a way that each of the two parts weighs even number of kilos, at the same time it is not obligatory that the parts are equal. The boys are extremely tired and want to start their meal as soon as possible, that's why you should help them and find out, if they can divide the watermelon in the way they want. For sure, each of them should get a part of positive weight.",
    inputFormat: "The first (and the only) input line contains integer number w (1 <= w <= 100) — the weight of the watermelon bought by the boys.",
    outputFormat: "Print YES, if the boys can divide the watermelon into two parts, each of them weighing even number of kilos; and NO in the opposite case.",
    constraints: "1 <= w <= 100",
    topic: "Number Theory",
    sampleCases: [
      { input: "8", output: "YES", explanation: "For example, the watermelon can be divided into two parts of 2 and 6 kilos respectively (both numbers are even and positive)." },
      { input: "2", output: "NO", explanation: "The only division is 1 and 1, which are odd numbers." }
    ],
    testCases: [
      { input: "8", output: "YES" },
      { input: "2", output: "NO" },
      { input: "1", output: "NO" },
      { input: "10", output: "YES" },
      { input: "12", output: "YES" },
      { input: "99", output: "NO" },
      { input: "100", output: "YES" }
    ],
    hints: [
      "Check if the weight of the watermelon is strictly greater than 2.",
      "A number w can be divided into two even positive numbers if and only if w is even and w > 2."
    ],
    starterJavascript: `// Read input from stdin and print output to stdout
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
    starterPython: `# Read input from stdin and print output to stdout
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
    inputFormat: "The first line contains an integer n (1 <= n <= 100). Each of the following n lines contains one word. All the words consist of lowercase Latin letters and possess lengths from 1 to 100 characters.",
    outputFormat: "Print n lines. The i-th line should contain the result of replacing of the i-th word from the input data.",
    constraints: "1 <= n <= 100\nLength of word: 1 to 100 letters",
    topic: "Strings",
    sampleCases: [
      { input: "4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis", output: "word\nl10n\ni18n\np43s", explanation: "Only words longer than 10 characters are abbreviated." }
    ],
    testCases: [
      { input: "4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis", output: "word\nl10n\ni18n\np43s" },
      { input: "1\na", output: "a" },
      { input: "2\nsupercalifragilisticexpialidocious\nabcdefghijk", output: "s32s\na9k" }
    ],
    hints: [
      "Check if the word's length is strictly greater than 10 characters.",
      "For words longer than 10 letters, print the first letter, the length of the word minus 2, and the last letter."
    ],
    starterJavascript: `const readline = require('readline');
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
        if (word.length > 10) {
            console.log(word[0] + (word.length - 2) + word[word.length - 1]);
        } else {
            console.log(word);
        }
    }
});`,
    starterPython: `import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    n = int(lines[0])
    for i in range(1, n + 1):
        word = lines[i]
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
    inputFormat: "The input contains two lines. The first line contains space-separated integers representing the array nums. The second line contains a single integer representing the target.",
    outputFormat: "Print the two indices (0-indexed) space-separated in increasing order.",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
    topic: "Arrays",
    sampleCases: [
      { input: "2 7 11 15\n9", output: "0 1", explanation: "Because nums[0] + nums[1] == 2 + 7 == 9, we return 0 1." },
      { input: "3 2 4\n6", output: "1 2", explanation: "Because nums[1] + nums[2] == 2 + 4 == 6, we return 1 2." }
    ],
    testCases: [
      { input: "2 7 11 15\n9", output: "0 1" },
      { input: "3 2 4\n6", output: "1 2" },
      { input: "3 3\n6", output: "0 1" },
      { input: "-1 -2 -3 -4 -5\n-8", output: "2 4" }
    ],
    hints: [
      "A brute force approach checks all pairs, which takes O(n^2) time.",
      "To optimize to O(n), use a Hash Map to store the index of each number. For each number, check if (target - number) is already in the map."
    ],
    starterJavascript: `const readline = require('readline');
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
    starterPython: `import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    
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
    title: "Binary Search Implementation",
    platform: "LeetCode",
    difficulty: "Easy",
    description: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.",
    inputFormat: "The input contains two lines. The first line contains space-separated integers representing the sorted array nums. The second line contains target.",
    outputFormat: "Print the index of target (0-indexed), or -1 if not found.",
    constraints: "-10^4 <= nums[i], target <= 10^4\nnums is sorted in ascending order.",
    topic: "Binary Search",
    sampleCases: [
      { input: "-1 0 3 5 9 12\n9", output: "4", explanation: "9 exists in nums and its index is 4." },
      { input: "-1 0 3 5 9 12\n2", output: "-1", explanation: "2 does not exist in nums so return -1." }
    ],
    testCases: [
      { input: "-1 0 3 5 9 12\n9", output: "4" },
      { input: "-1 0 3 5 9 12\n2", output: "-1" },
      { input: "5\n5", output: "0" },
      { input: "5\n2", output: "-1" }
    ],
    hints: [
      "Maintain a left pointer at 0 and a right pointer at nums.length - 1.",
      "Loop while left <= right, calculate mid = Math.floor((left + right) / 2), and compare nums[mid] with target."
    ],
    starterJavascript: `const readline = require('readline');
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
    
    // Binary Search logic
    let left = 0;
    let right = nums.length - 1;
    let ans = -1;
    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) {
            ans = mid;
            break;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
      }
      console.log(ans);
});`,
    starterPython: `import sys

def solve():
    lines = sys.stdin.read().splitlines()
    if not lines:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    
    left = 0
    right = len(nums) - 1
    ans = -1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            ans = mid
            break
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    print(ans)

if __name__ == '__main__':
    solve()`
  }
];

import User from '../models/User.js';

export const seedProblems = async () => {
  try {
    console.log('Resetting and seeding initial MongoDB coding challenges...');
    await Problem.deleteMany({});
    await Problem.insertMany(initialProblems);
    console.log('Problem seeding completed successfully.');

    // Seed default demo users if database is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default demo accounts...');
      await User.create([
        {
          username: 'Akshit',
          email: 'akshit@example.com',
          password: 'password123',
          rating: 1450,
          wins: 12,
          losses: 3,
          streak: 4,
          profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        },
        {
          username: 'Tourist',
          email: 'tourist@example.com',
          password: 'password123',
          rating: 3800,
          wins: 150,
          losses: 2,
          streak: 25,
          profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        },
        {
          username: 'Benq',
          email: 'benq@example.com',
          password: 'password123',
          rating: 3500,
          wins: 120,
          losses: 8,
          streak: 12,
          profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
        }
      ]);
      console.log('Default demo accounts seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

