const fs = require('fs');
const path = 'D:\\SupainNandy\\SDU-Backend\\src\\controllers\\studentProfile.controller.js';

let content = fs.readFileSync(path, 'utf8');

const searchStr = 'export const deleteStudentProfile = async (req, res, next) => {';
const startIndex = content.indexOf(searchStr);

if (startIndex !== -1) {
    const newFunction = `export const deleteStudentProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = BigInt(id);
    const isFinal = req.query.is_final === 'true';

    let existingStudent;
    if (isFinal) {
      existingStudent = await prisma.studentProfile.findUnique({
        where: { student_id: studentId }
      });
    } else {
      existingStudent = await prisma.tempStudentProfile.findUnique({
        where: { temp_student_id: studentId }
      });
    }

    if (!existingStudent) {
      return sendError(res, 404, 'Student Profile not found');
    }

    // Delete associated Cloudinary assets before deleting student profile
    const documentUrls = [
      existingStudent.profile_picture_url,
      existingStudent.aadhar_front_url,
      existingStudent.aadhar_back_url,
      existingStudent.last_qualification_cert_url,
      existingStudent.clc_migration_cert_url,
      existingStudent.marksheet_url,
      existingStudent.migration_cert_url
    ];

    for (const docUrl of documentUrls) {
      if (docUrl) {
        await deleteFromCloudinary(docUrl);
      }
    }

    if (isFinal) {
      await prisma.studentProfile.delete({
        where: { student_id: studentId }
      });
    } else {
      await prisma.tempStudentProfile.delete({
        where: { temp_student_id: studentId }
      });
    }

    return sendSuccess(res, 200, 'Student Profile deleted successfully');
  } catch (error) {
    next(error);
  }
};
`;
    content = content.substring(0, startIndex) + newFunction;
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully replaced deleteStudentProfile');
} else {
    console.log('Could not find deleteStudentProfile');
}
