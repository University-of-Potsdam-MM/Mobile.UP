import { ESettingType } from 'src/app/lib/interfaces';

// See Settings README.md for info on how to create Settings

export const SETTINGS = [
    {
        key: 'general',
        value: '',
        type: ESettingType.placeholder
    },
    {
        key: 'language',
        value: 'Deutsch',
        options: [{key: 'Deutsch'}, {key: 'Englisch'}],
        type: ESettingType.string_radio,
        icon: 'globe'
    },
    {
        key: 'campus',
        value: 'Griebnitzsee',
        options: [{key: 'Neues Palais'}, {key: 'Griebnitzsee'}, {key: 'Golm'}, {key: 'Botanischer Garten'}],
        type: ESettingType.string_radio,
        icon: 'locate'
    },
    {
        key: 'inpractice',
        value: '',
        type: ESettingType.placeholder
    },
    {
        key: 'practice',
        value: '',
        options: [
            {key: 'Jobs für Studierende'},
            {key: 'Jobs für Absolventen'},
            {key: 'Abschlussarbeit'},
            {key: 'Praktika'}
        ],
        type: ESettingType.checkbox,
        icon: 'filing'
    },
    {
        key: 'studyarea',
        value: '',
        options: [
            {key: 'Geistes- und Kulturwissenschaften'},
            {key: 'Wirtschafts- und Sozialwissenschaften'},
            {key: 'Mathematik und Informatik'},
            {key: 'Naturwissenschaften'},
            {key: 'Rechtswissenschaften'},
            {key: 'Bildungs- und Kognitionswissenschaften'},
            {key: 'Sport- und Gesundheitswissenschaften'},
            {key: 'fächerübergreifend'},
        ],
        type: ESettingType.checkbox,
        icon: 'filing'
    },
    {
        key: 'domestic',
        value: true,
        type: ESettingType.boolean,
        icon: 'home',
        options: []
    },
    {
        key: 'foreign',
        value: true,
        type: ESettingType.boolean,
        icon: 'airplane',
        options: []
    },
    {
        key: 'externalRedirect',
        value: '',
        type: ESettingType.placeholder
    },
    {
        key: 'showDialog',
        value: true,
        type: ESettingType.boolean,
        icon: 'albums',
        options: []
    },
    {
        key: 'appRedirect',
        value: [],
        options: [
            {key: 'Moodle.UP'},
            {key: 'Reflect.UP'}
        ],
        type: ESettingType.checkbox,
        icon: 'appstore',
        mobileOnly: true
    }
];
