function getLearnerData(courseInfo, assignmentGroup, learnerSubmissions) {
    try {
        if (assignmentGroup.course_id !== courseInfo.id) {
            throw new Error(`Input Error: Assignment Group ID ${assignmentGroup.id} does not match Course ID ${courseInfo.id}.`);
        }

        // Set the current date as December 1st, 2025
        const today = new Date("2025-12-01"); 

        const learnerMap = new Map(); 

        const processSubmission = (submission, assignment, currentDate) => {
            const dueDate = new Date(assignment.due_at);
            const submittedAt = new Date(submission.submission.submitted_at);
            let score = submission.submission.score;
            const pointsPossible = assignment.points_possible;

            if (dueDate > currentDate) {
                return null;
            }

            if (pointsPossible === 0) {
                console.warn(`Skipping Assignment ID ${assignment.id}: Points possible is zero.`);
                return null;
            }

            if (submittedAt > dueDate) {
                const latePenalty = pointsPossible * 0.10;
                score = score - latePenalty;
                
                if (score < 0) {
                    score = 0;
                }
            }

            const percentage = score / pointsPossible;

            return {
                assignmentId: assignment.id,
                score: score,
                pointsPossible: pointsPossible,
                percentage: percentage
            };
        };

        learnerSubmissions.forEach(submission => {
            if (typeof submission.learner_id !== 'number' || typeof submission.assignment_id !== 'number') {
                console.warn(`Skipping submission due to invalid ID type: ${JSON.stringify(submission)}`);
                return;
            }

            const assignment = assignmentGroup.assignments.find(a => a.id === submission.assignment_id);

            if (!assignment) {
                console.warn(`Skipping submission for unknown assignment ID: ${submission.assignment_id}`);
                return;
            }

            const processedData = processSubmission(submission, assignment, today);

            if (processedData) {
                const learnerId = submission.learner_id;

                if (!learnerMap.has(learnerId)) {
                    learnerMap.set(learnerId, {
                        id: learnerId,
                        totalScore: 0,
                        totalPossible: 0
                    }); 
                }

                const learnerData = learnerMap.get(learnerId);
                learnerData.totalScore += processedData.score;
                learnerData.totalPossible += processedData.pointsPossible;
                
                learnerData[processedData.assignmentId] = parseFloat(processedData.percentage.toFixed(3));
            }
        });

        const resultArray = [];
        for (const [id, data] of learnerMap.entries()) {
            
            const finalAvg = data.totalPossible === 0 ? 0 : data.totalScore / data.totalPossible;

            delete data.totalScore;
            delete data.totalPossible;

            data.avg = parseFloat(finalAvg.toFixed(3)); 

            resultArray.push(data);
        }

        return resultArray;

    } catch (error) {
        console.error("Critical error in processing data:", error.message);
        return [];
    }
}

// Sample Data

const CourseInfo = {
    id: 451,
    name: "Introduction to JavaScript"
};

const AssignmentGroup = {
    id: 12345,
    name: "Fundamentals of JavaScript",
    course_id: 451,
    group_weight: 25,
    assignments: [
        { id: 1, name: "Declare a Variable", due_at: "2023-01-25", points_possible: 50 },
        { id: 2, name: "Write a Function", due_at: "2023-02-27", points_possible: 150 },
        { id: 3, name: "Code the World", due_at: "3156-11-15", points_possible: 500 }
    ]
};

const LearnerSubmissions = [
    { learner_id: 125, assignment_id: 1, submission: { submitted_at: "2023-01-25", score: 47 } }, 
    { learner_id: 125, assignment_id: 2, submission: { submitted_at: "2023-02-12", score: 150 } }, 
    { learner_id: 125, assignment_id: 3, submission: { submitted_at: "2023-01-25", score: 400 } },
    { learner_id: 132, assignment_id: 1, submission: { submitted_at: "2023-01-24", score: 39 } }, 
    { learner_id: 132, assignment_id: 2, submission: { submitted_at: "2023-03-07", score: 140 } }
];

// Execute the function
const result = getLearnerData(CourseInfo, AssignmentGroup, LearnerSubmissions);

console.log(result);