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

export interface IPulsAPIResponse_getLectureScheduleRoot {
}

export interface IPulsApiRequest_getLectureScheduleRoot {
  condition: IPulsApiRequest_getLectureScheduleRoot_condition;
}

export interface IPulsApiRequest_getLectureScheduleRoot_condition {
  semester: number;
}

export interface IPulsAPIResponse_getLectureScheduleSubTree {
}

export interface IPulsApiRequest_getLectureScheduleSubTree {
  condition: IPulsApiRequest_getLectureScheduleSubTree_condition;
}

export interface IPulsApiRequest_getLectureScheduleSubTree_condition {
  headerId: number;
}

export interface IPulsApiRequest_getLectureScheduleCourses {
  condition: IPulsApiRequest_getLectureScheduleCourses_condition;
}

export interface IPulsApiRequest_getLectureScheduleCourses_condition {
  headerId: number;
}

export interface IPulsAPIResponse_getLectureScheduleCourses {
}

export interface IPulsApiRequest_getCourseData {
  condition: IPulsApiRequest_getCourseData_condition;
}

export interface IPulsApiRequest_getCourseData_condition {
  courseId: number;
}

export interface IPulsAPIResponse_getCourseData {
}

export interface IPulsApiRequest_getPersonalStudyAreas {
  'user-auth':ICredentials
}

export interface IPulsAPIResponse_getPersonalStudyAreas {
  personalStudyAreas: {
    Abschluss:IGradeDegree;
  }
  message?:string;
}

export interface IGradeDegree {
  AbLtxt: string;
  Abschl: string;
  MtkNr: string;
  Semester: string;
  StgNr: string;
  Studiengaenge: any;
}


export interface IPulsApiRequest_getAcademicAchievements {
  condition: IPulsApiRequest_getAcademicAchievements_condition;
  'user-auth':ICredentials
}

export interface IPulsApiRequest_getAcademicAchievements_condition {
  Semester: string;
  MtkNr: string;
  StgNr: string;
}

export interface IPulsAPIResponse_getAcademicAchievements {
}