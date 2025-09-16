// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const ExcelJS = require('exceljs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' })); // ensure body parsed

app.use(express.static(path.join(__dirname, 'public'))); // serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const FILE_PATH = path.join(__dirname, '/data/form_submissions.xlsx');
const SHEET_NAME = 'Submissions';

// The columns you'll write in this exact order
const columns = [
  "participant_id","first_name","last_name","phone","partnerName","date_of_birth",
  "hypertension","high_cholesterol","diabetes_type_1_or_type_2","stroke_tia","heart_attack",
  "coronary_heart_disease","heart_failure","vascular_peripheral_arterial_disease",
  "congenital_heart_disease_defects","gestational_hypertension","gestational_diabetes",
  "pre_eclampsia_eclampsia","blood_pressure","cholesterol_statin",
  "cholesterol_other_prescribed_medication","blood_sugar",
  "are_you_taking_aspirin_daily_to_help_prevent_a_heart_attack_or_stroke",
  "high_blood_pressure_0_7_days","high_cholesterol_0_7_days","high_blood_sugar_0_7_days",
  "after_being_prescribed_medication_on_what_date_s_did_the_participant_have_her_blood_pressure_re_measured_either_by_a_healthcare_provider_or_with_another_community_resource",
  "do_you_measure_your_blood_pressure_at_home_or_using_other_calibrated_sources",
  "how_often_do_you_measure_your_blood_pressure_at_home_or_using_other_calibrated_sources",
  "do_you_regularly_share_blood_pressure_readings_with_a_health_care_provider_for_feedback",
  "how_many_cups_of_fruits_and_vegetables_do_you_eat_in_an_average_day",
  "do_you_eat_fish_at_least_two_times_a_week",
  "thinking_about_all_the_servings_of_grain_products_you_eat_in_a_typical_day_how_many_are_whole_grains",
  "do_you_drink_less_than_36_ounces_450_calories_of_sugar_sweetened_beverages_weekly",
  "are_you_currently_watching_or_reducing_your_sodium_or_salt_intake",
  "in_the_past_7_days_how_often_do_you_have_a_drink_containing_alcohol",
  "how_many_alcoholic_drinks_on_average_do_you_consume_during_a_day_you_drink",
  "how_many_minutes_of_physical_activity_exercise_do_you_get_in_a_week",
  "do_you_smoke_includes_cigarettes_pipes_or_cigars_smoked_tobacco_in_any_form",
  "little_interest_or_pleasure_in_doing_things_not_at_all_several_days_more_than_half_or_nearly_every_day",
  "feeling_down_depressed_or_hopeless_not_at_all_several_days_more_than_half_or_nearly_every_day",
  "risk_reduction_counseling_completion_date","height","weight","waist_circumference",
  "clinical_assessment_date_office_visit_date","systolic_blood_pressure","diastolic_blood_pressure",
  "fasting_status","total_cholesterol","hdl_cholesterol","ldl_cholesterol","triglycerides",
  "glucose","a1c_percentage","is_a_medical_follow_up_for_blood_pressure_reading_necessary",
  "what_is_the_date_of_the_medically_necessary_follow_up_appointment",
  "number_of_lifestyle_program_lsp_health_coaching_hc_sessions_received_by_the_participant_associated_with_the_current_screening",
  "lifestyle_program_lsp_health_coaching_hc_referral_date",
  "date_of_lifestyle_program_lsp_health_coaching_hc_session",
  "lifestyle_program_lsp_health_coaching_hc_id","type_of_tobacco_cessation_resource",
  "date_of_referral_to_tobacco_cessation_resource","tobacco_cessation_activity_completed",
  "do_you_use_desktop_laptop_smartphone_tablet_other_of_the_following_types_of_computers",
  "do_you_or_any_member_of_this_household_have_access_to_the_internet",
  "during_the_last_12_months_was_there_a_time_when_you_were_worried_you_would_run_out_of_food_because_of_a_lack_of_money_or_other_resources",
  "have_you_ever_missed_a_doctor_s_appointment_because_of_transportation_problems",
  "if_you_are_you_currently_using_childcare_services_please_identify_the_type_of_services_you_use_if_not_select_not_applicable",
  "have_you_had_any_of_these_child_care_related_problems_during_the_past_year_select_all_that_apply",
  "what_is_your_housing_situation_today",
  "how_often_does_your_partner_physically_hurt_insult_or_talk_down_to_you",
  "do_you_occasionally_forget_become_careless_or_discontinue_your_name_of_health_condition_medication_either_when_feeling_better_or_if_experiencing_worsened_symptoms_after_taking_it",
  "social_service_id","social_service_referral_date","date_of_social_services_and_support_utilization"
];

let workbook = null;
let worksheet = null;

async function ensureWorkbook(headers) {
  if (workbook && worksheet) {
    return { workbook, worksheet };
  }

  const wb = new ExcelJS.Workbook();

  if (fs.existsSync(FILE_PATH)) {
    await wb.xlsx.readFile(FILE_PATH);
    let ws = wb.getWorksheet(SHEET_NAME);
    if (!ws) {
      ws = wb.addWorksheet(SHEET_NAME);
      ws.addRow(headers);
      ws.getRow(1).font = { bold: true };
      await wb.xlsx.writeFile(FILE_PATH);
    }
    workbook = wb;
    worksheet = ws;
    return { workbook, worksheet };
  }

  // create new file
  const ws = wb.addWorksheet(SHEET_NAME);
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true };
  await wb.xlsx.writeFile(FILE_PATH);

  workbook = wb;
  worksheet = ws;
  return { workbook, worksheet };
}

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Append a row
app.post('/api/submit', async (req, res) => {
  try {
    console.log('Incoming body keys:', Object.keys(req.body));  // DEBUG
    const { workbook: wb, worksheet: ws } = await ensureWorkbook(columns);

    // Map body → columns in fixed order
    const rowValues = columns.map(key => (req.body[key] ?? ''));
    console.log('Row (ordered) ->', rowValues); // DEBUG

    ws.addRow(rowValues);
    await wb.xlsx.writeFile(FILE_PATH);

    res.json({ status: 'Saved', rows: ws.rowCount });
  } catch (err) {
    console.error('Save failed:', err); // DEBUG
    res.status(500).json({ error: 'Failed to save row', details: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
});
