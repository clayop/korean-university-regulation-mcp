export const UNIVERSITIES = {
    hansung: {
        id: "hansung",
        name: "한성대학교",
        domain: "rule.hansung.ac.kr",
        protocol: "https",
        maxScanId: 1700,
    },
    kaist: {
        id: "kaist",
        name: "KAIST (한국과학기술원)",
        domain: "rule.kaist.ac.kr",
        protocol: "https",
        maxScanId: 3500,
    },
    korea: {
        id: "korea",
        name: "고려대학교",
        domain: "policies.korea.ac.kr",
        protocol: "https",
        maxScanId: 2500,
    },
    khu: {
        id: "khu",
        name: "경희대학교",
        domain: "rule.khu.ac.kr",
        protocol: "https",
        maxScanId: 2500,
    },
    kookmin: {
        id: "kookmin",
        name: "국민대학교",
        domain: "rule.kookmin.ac.kr",
        protocol: "https",
        maxScanId: 2500,
    },
    kwangwoon: {
        id: "kwangwoon",
        name: "광운대학교",
        domain: "rule.kwangwoon.ac.kr",
        protocol: "http",
        maxScanId: 1000,
    },
    swu: {
        id: "swu",
        name: "서울여자대학교",
        domain: "rule.swu.ac.kr",
        protocol: "https",
        maxScanId: 2000,
    },
    inje: {
        id: "inje",
        name: "인제대학교",
        domain: "rule.inje.ac.kr",
        protocol: "https",
        maxScanId: 2000,
    },
    mokwon: {
        id: "mokwon",
        name: "목원대학교",
        domain: "rule.mokwon.ac.kr",
        protocol: "https",
        maxScanId: 2000,
    },
    kyonggi: {
        id: "kyonggi",
        name: "경기대학교",
        domain: "rule.kyonggi.ac.kr",
        protocol: "http",
        maxScanId: 1000,
    },
    duksung: {
        id: "duksung",
        name: "덕성여자대학교",
        domain: "rule.duksung.ac.kr",
        protocol: "https",
        maxScanId: 1500,
    },
    koreatech: {
        id: "koreatech",
        name: "한국기술교육대학교",
        domain: "rule.koreatech.ac.kr",
        protocol: "https",
        maxScanId: 1000,
    },
    konyang: {
        id: "konyang",
        name: "건양대학교",
        domain: "rule.konyang.ac.kr",
        protocol: "https",
        maxScanId: 2000,
    },
    konkuk: {
        id: "konkuk",
        name: "건국대학교",
        domain: "rule.konkuk.ac.kr",
        protocol: "https",
        maxScanId: 1000,
    },
};
export function getUniversityBaseUrl(uni) {
    return `${uni.protocol}://${uni.domain}/lmxsrv/law/lawFullContent.do`;
}
export function getUniversityIds() {
    return Object.keys(UNIVERSITIES);
}
export function getUniversityList() {
    return Object.values(UNIVERSITIES).map((u) => ({ id: u.id, name: u.name }));
}
