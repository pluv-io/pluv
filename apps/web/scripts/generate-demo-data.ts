import { faker } from "@faker-js/faker";
import fs from "fs-extra";
import path from "path";
import { labels, priorities, statuses } from "../src/components/HeroDemo/data";

faker.seed(1);

const srcPath = path.resolve(__dirname, "../src");
const outputPath = path.resolve(srcPath, "./components/HeroDemo/generated/tasks.json");

const tasks = Array.from({ length: 100 }, () => ({
    id: `TASK-${faker.number.int({ min: 1000, max: 9999 })}`,
    title: faker.hacker.phrase().replace(/^./, (letter) => letter.toUpperCase()),
    status: faker.helpers.arrayElement(statuses).value,
    label: faker.helpers.arrayElement(labels).value,
    priority: faker.helpers.arrayElement(priorities).value,
}));

fs.ensureFileSync(outputPath);
fs.writeFileSync(outputPath, JSON.stringify(tasks, null, 2));

console.log("✅ Tasks data generated.");
