import {ESettingType} from "../../library/interfaces";

export const SETTINGS = [
  {key: "test_ph", value: false, type: ESettingType.placeholder},
  {key: "test_1", value: "", type: ESettingType.string, options: []},
  {key: "test_2", value: 0, type: ESettingType.number, options: []},
  {key: "test_3", value: false, type: ESettingType.boolean, options: []},
  {key: "test_ph", value: false, type: ESettingType.placeholder},
  {
    key: "test_4",
    value: "0",
    options: [{key: 0, lbl: "deaktivated"}, {key: 1, lbl: "1"}, {key: 2, lbl: "2"}],
    type: ESettingType.number_radio
  },
  {
    key: "test_5",
    value: "test 1",
    options: [{key: "test_1", lbl: "Test 1"}, {key: "test_2", lbl: "Test 2"}, {key: "test_3", lbl: "Test 3"}],
    type: ESettingType.string_radio
  },
  {
    key: "test_6",
    value: "test_1",
    options: [{key: "test_1", lbl: "Test 1"}, {key: "test_2", lbl: "Test 2"}, {key: "test_3", lbl: "Test 3"}],
    type: ESettingType.checkbox
  }
];
