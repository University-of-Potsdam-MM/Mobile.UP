import {ICredentials} from "../providers/login-provider/interfaces";

export interface IModul {
  moduleTitle: string;
  examNumber: string;
  shortCut: string;
}

export interface IExam {
  examtitle: string;
  examNumber: string;
  shortCut: string;
  modul: IModul;
}

export interface ISelectedExam {
  pordnr_select: string;
  module: string;
  exam: IExam;
}

export interface ILecturer {
  lecturerId: string;
  lecturerLastname: string;
  lecturerFirstname: string;
  lecturerEmail: string;
  lecturerTitle: string;
}

export interface ILecturers {
  lecturer: ILecturer[] | ILecturer;
}

export interface IEvent {
  eventId: string;
  groupId: string;
  group: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  daySC: string;
  day: string;
  rhythmSC: string;
  rhythm: string;
  location: string;
  building: string;
  room: string;
  roomType: string;
  roomSc: string;
  lecturers: ILecturers;
}

export interface IEvents {
  event: IEvent[];
}

export interface ICourse {
  courseId: string;
  courseName: string;
  courseType: string;
  semesterSC: string;
  semester: string;
  enrolmentStatus: string;
  selectedExam: ISelectedExam;
  events: IEvents;
  courseNumber: string;
}

export interface IActualCourses {
  course: ICourse[];
}

export interface IPastCourses {
  course: ICourse[];
}

export interface IStudent {
  lastname: string;
  firstname: string;
  studentNumber: string;
  actualCourses: IActualCourses;
  pastCourses: IPastCourses;
}

export interface IStudentCourses {
  student: IStudent;
}

export interface IPulsAPIResponse_getStudentCourses {
  studentCourses: IStudentCourses;
  message?:string;
}

export interface IPulsApiRequest_getStudentCourses {
  condition:IPulsApiRequest_getStudentCourses_condition;
  'user-auth':ICredentials
}

export interface IPulsApiRequest_getStudentCourses_condition {
  semester:number;
  allLectures:number;
}
