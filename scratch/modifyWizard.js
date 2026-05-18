const fs = require('fs');

const file = 'apps/web-admin/components/organizers/CreateOrganiserWizard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Rename Component
content = content.replace(/export function CreateUserWizard/g, 'export function CreateOrganiserWizard');

// 2. Change STEPS
content = content.replace(
  'const STEPS = ["Basic Information", "Role & Permissions", "Organization", "Review & Confirm"];',
  'const STEPS = ["Contact Person Information", "Organization", "Review & Confirm"];'
);

// 3. Update STEPS logic in handleNext
// Remove the skip logic for roles
content = content.replace(
  /if \(step === 2 && !\(\s*formData\.roles\.includes\("CLUB_ADMIN"\)\s*\|\|\s*formData\.roles\.includes\("MARKER"\)\s*\)\) \{\s*setStep\(4\);\s*return;\s*\}/g,
  ''
);

// Update step validations
content = content.replace(/if \(step === 3\) \{[\s\S]*?if \(!orgProfile\.name\.trim\(\)\)/, `if (step === 2) {
      if (!orgProfile.name.trim())`);

// 4. Update the switch(step) logic
// case 1 is Contact Person Information
content = content.replace(/>Basic Information<\/h4>/, '>Contact Person Information</h4>');
content = content.replace(/>Essential information about the user<\/p>/, '>Essential information about the primary contact for this organization.</p>');

// 5. Remove "case 2:" block entirely, and shift cases.
// We'll replace the switch block manually or with regex.
// Find `case 2:` down to `case 3:`
const case2Regex = /case 2:[\s\S]*?(?=case 3:)/;
content = content.replace(case2Regex, '');

// Rename case 3: to case 2: and case 4: to case 3:
content = content.replace(/case 3:/, 'case 2:');
content = content.replace(/case 4:/, 'case 3:');

// 6. Inside the new case 2 (Organization), remove the unnecessary fields:
// "Country", "State / Province", "LGA / City", "Organization Address", "Contact Person Details" block
// We can use regex to remove these Field blocks.
const countryFieldRegex = /<div className="grid grid-cols-2 gap-4 mt-4">[\s\S]*?State \/ Province[\s\S]*?<\/div>[\s\S]*?<Field label="LGA \/ City" required>[\s\S]*?<\/Field>[\s\S]*?<Field label="Organization Address" required>[\s\S]*?<\/Field>/;
content = content.replace(countryFieldRegex, '');

const contactPersonRegex = /{[\s\*\/]*Contact Person Details[\s\*\/]*}[\s\S]*?(?={[\s\*\/]*About the Organization[\s\*\/]*})/;
content = content.replace(contactPersonRegex, '');

// 7. Update Payload construction
const payloadRegex = /const payload: any = \{[\s\S]*?clubLogo: isOrg \? orgProfile\.logo : undefined,\s*\};/;
const newPayload = `const payload: any = {
        firstName: formData.firstName.trim(),
        lastName: \`\${formData.middleName.trim()} \${formData.surname.trim()}\`.replace(/\\s+/g, ' ').trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone ? \`+\${countryCode}\${formData.phone.replace(/\\D/g, "")}\` : undefined,
        role: "CLUB_ADMIN", // Force role
        status: formData.status,
        profilePhoto: formData.profileImage || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(formData.firstName)}+\${encodeURIComponent(formData.surname)}&background=10b981&color=fff&bold=true\`,
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        state: formData.state || undefined,
        city: formData.city || undefined,
        address: formData.address || undefined,
        clubName: orgProfile.name.trim(),
        clubAddress: formData.address || undefined, // Inherit from contact person
        orgState: formData.state || undefined, // Inherit from contact person
        orgCity: formData.city || undefined, // Inherit from contact person
        clubLogo: orgProfile.logo || undefined,
      };`;
content = content.replace(payloadRegex, newPayload);

// Remove `const isOrg = formData.roles.includes("CLUB_ADMIN") || formData.roles.includes("MARKER");`
content = content.replace(/const isOrg = formData\.roles\.includes\("CLUB_ADMIN"\) \|\| formData\.roles\.includes\("MARKER"\);/, '');

// 8. Update Review & Confirm (now case 3)
// Remove roles logic from review
content = content.replace(/\{formData\.roles\.includes\("PLAYER"\) && \([\s\S]*?\}\)/, '');
content = content.replace(/\{\(formData\.roles\.includes\("CLUB_ADMIN"\) \|\| formData\.roles\.includes\("MARKER"\)\) && \([\s\S]*?<div className="col-span-2 space-y-2 border-t border-gray-100 pt-2\.5 mt-1">/g, '<div className="col-span-2 space-y-2 border-t border-gray-100 pt-2.5 mt-1">');

// We also need to fix the matching bracket for the `{formData.roles...` block we just removed the start of.
// Actually, it's safer to just replace the whole right column of the Review step.
const reviewRightColumnRegex = /<div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3\.5 shadow-sm flex flex-col justify-between">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;

const newReviewRightColumn = `<div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3.5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                    <h5 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Organization Details</h5>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Name</span>
                        <span className="text-[12px] text-gray-700 font-semibold truncate block">{orgProfile.name || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Type</span>
                        <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block mt-0.5">{orgProfile.type || "—"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase block">Address (Inherited)</span>
                      <span className="text-[11px] text-gray-600 font-medium block leading-tight mt-0.5">{formData.address || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`;

content = content.replace(reviewRightColumnRegex, newReviewRightColumn);

// Change title
content = content.replace(/title=\{editingUser \? "Edit User Details" : "Add New User"\}/, 'title={editingUser ? "Edit Organiser Details" : "Add New Organiser"}');

fs.writeFileSync(file, content);
console.log('Successfully updated CreateOrganiserWizard.tsx');
