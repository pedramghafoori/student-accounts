// components/CourseList.js
"use client";

export default function CourseList() {
  const mockCourses = [
    { id: 1, title: "Water Rescue Basics" },
    { id: 2, title: "Advanced Lifeguard Techniques" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Courses</h2>
      {mockCourses.map((course) => (
        <div
          key={course.id}
          className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
        >
          <div>
            <h3 className="font-medium">{course.title}</h3>
            <p className="text-sm text-gray-500">Some course description...</p>
          </div>
          <a
            href={`/courses/${course.id}`}
            className="inline-block text-blue-600 hover:underline"
          >
            View
          </a>
        </div>
      ))}
    </div>
  );
}