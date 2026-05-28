import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, FileText, Mail, AlertTriangle } from 'lucide-react';

interface LegalModalsProps {
  document: 'Terms of Service' | 'Privacy Policy' | 'DMCA' | 'Contact' | null;
  onClose: () => void;
  language: 'en' | 'ko';
}

export function LegalModals({ document, onClose, language }: LegalModalsProps) {
  if (!document) return null;

  const content = {
    'Terms of Service': {
      icon: <FileText className="w-5 h-5 text-cyan-400" />,
      ko: {
        title: "이용약관 (Terms of Service)",
        body: `마지막 업데이트: 2026-05-25

1. 서비스 이용
Dealirious(이하 "서비스")는 게임 가격 정보를 수집하여 제공하는 플랫폼입니다. 서비스는 있는 그대로(As-Is) 제공되며, 가격의 정확성이나 가용성을 보장하지 않습니다. 실시간 환율 및 각 스토어의 사정에 따라 실제 결제 금액이 다를 수 있습니다.

2. 지적재산권
서비스 내에서 언급되는 모든 게임 상표, 로고, 박스 아트 및 관련 콘텐츠의 저작권은 각 권리자(Sony, Microsoft, Valve, Epic Games 등)에게 있습니다. 이 서비스는 해당 권리자들과 공식적으로 제휴, 보증 또는 후원받지 않습니다.

3. 면책조항 (전자상거래법 관련 고지)
Dealirious는 통신판매중개자이며 통신판매의 당사자가 아닙니다. 따라서 당사는 각 스토어(판매자)가 등록한 상품, 거래 정보 및 거래에 대하여 어떠한 법적 책임도 지지 않습니다. 구매 전 반드시 해당 스토어의 가격과 조건을 직접 확인하시기 바랍니다.

4. 쿠키 및 데이터
당사는 Firebase를 통한 구글 로그인 인증 및 브라우저 로컬 스토리지를 활용하여 위시리스트 동기화를 제공합니다.`
      },
      en: {
        title: "Terms of Service",
        body: `Last Updated: May 22, 2026

1. Acceptance of Terms
By accessing Dealirious ("the Service"), you agree to these terms. The Service provides aggregated game deal information and is provided "As-Is". We do not guarantee the real-time accuracy or availability of the prices displayed.

2. Intellectual Property
All trademarks, game names, logos, and box arts are the intellectual property of their respective owners (e.g., Sony, Microsoft, Valve, Epic Games, Meta, etc.). Dealirious is an independent data tool and is not officially affiliated with, endorsed by, or sponsored by these corporate entities.

3. Disclaimer of Warranties
We provide no warranties, explicit or implied. We are not liable for any discrepancies in pricing, failed transactions at third-party storefronts, or any damages potentially resulting from utilizing our Service.

4. User Accounts & Data
We utilize Google Firebase Authentication for account management. You are responsible for safeguarding your login credentials. We reserve the right to ban or terminate accounts involved in automated scraping, abuse, or unauthorized access attempts.`
      }
    },
    'Privacy Policy': {
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      ko: {
        title: "개인정보 처리방침 (Privacy Policy)",
        body: `마지막 업데이트: 2026-05-25

1. 수집하는 개인정보의 항목 및 수집 방법
- 필수 항목: 이메일 주소, 소셜 인증 토큰(구글 로그인 시)
- 수집 방법: 사용자가 귀하의 구글 계정을 통해 로그인할 때 자동 수집

2. 개인정보의 수집 및 이용 목적
수집된 정보는 다음의 목적을 위해서만 사용됩니다:
- 서비스 이용에 따른 사용자 인증 (Firebase 활용)
- 사용자의 위시리스트, 설정 유지 및 이메일(가격 알림) 발송 대상 확인
- 활용 목적: 서비스 이용자 식별, 개인화 설정 유지, 악의적 트래픽 방지

3. 아동의 개인정보 보호
본 서비스는 만 14세 미만의 아동을 대상으로 하지 않으며, 고의로 만 14세 미만 아동의 개인정보를 수집하지 않습니다.

4. 개인정보의 보유 및 이용 기간
- 보유 기간: 사용자의 계정 탈퇴(회원 탈퇴) 시까지 보관됩니다.
- 삭제 절차: 계정을 탈퇴할 경우 해당 정보는 즉시 파기됩니다.

5. 개인정보의 제3자 제공 및 위탁
당사는 원칙적으로 사용자의 개인정보를 외부에 제공하거나 마케팅 목적으로 판매하지 않습니다. 단, 알림 메일 발송 등 서비스 제공을 위해 필요한 경우에 한해 관련 규정에 따라 최소한의 정보를 위탁할 수 있습니다.

5. 광고성 정보 수신 동의
주간 가격 알림(Weekly Price Alerts) 기능을 활성화할 경우, 특가 안내를 포함한 '광고성 정보 수신'에 동의한 것으로 간주됩니다. 알림은 설정 메뉴에서 언제든지 수신 거부(비활성화)할 수 있습니다.

6. 개인정보 보호책임자 및 고충처리
성명: Dealirious Privacy Officer (개인 개발자)
이메일: support@dealirious-app.local`
      },
      en: {
        title: "Privacy Policy",
        body: `Last Updated: May 25, 2026

1. Information We Collect
- When you authenticate via Google (Firebase Auth), we securely store your email address and authentication ID.
- We use browser local storage and cookies to record your preferences, wishlists, and display settings.

2. How We Use Your Information
- To authenticate your account across devices.
- To store and sync your game wishlist records.
- To send weekly price alert emails (if you opt-in).
- To detect and prevent abusive traffic or security vulnerabilities.

3. Children's Privacy
Our Service is not directed to children under the age of 14, and we do not knowingly collect personal information from children. If we become aware that we have inadvertently received personal information from a child under 14, we will delete such information from our records.

4. Data Sharing
We do not sell, rent, or trade your personal information to third parties for any purpose.  

5. Data Retention & Deletion
You maintain the right to delete your data anytime. Removing your account will result in permanent and immediate deletion of your saved wishlists, email address, and tracking metrics from our database.

6. Data Protection Officer (DPO) & Contact
For any concerns regarding your privacy or our data practices, contact: support@dealirious-app.local`
      }
    },
    'DMCA': {
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      ko: {
        title: "DMCA 저작권 보호 정책",
        body: `Dealirious는 타인의 지적재산권을 존중합니다. 당사는 각 스토어 프론트의 공개된 메타데이터 및 이미지(API)를 인덱싱하여 제공하고 있습니다.

저작권 침해가 발생했다고 생각되는 경우, 다음 정보를 포함하여 dmca@dealirious-app.local 로 이메일을 보내주시기 바랍니다:
1. 저작권 소유자를 대리할 권한이 있는 사람의 전자 또는 실물 서명
2. 침해되었다고 주장되는 저작물에 대한 설명 및 당사 웹사이트 내 위치
3. 귀하의 주소, 전화번호 및 이메일 주소
4. 이의가 제기된 사용이 저작권 소유자, 그 대리인 또는 법률에 의해 승인되지 않았다고 선의로 믿는다는 진술`
      },
      en: {
        title: "DMCA Copyright Policy",
        body: `Dealirious respects the intellectual property rights of others. We aggregate public metadata and product imagery from various gaming storefront APIs.

If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, please provide our Copyright Agent with the following information via dmca@dealirious-app.local:

1. A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
2. Identification of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works at a single online site are covered by a single notification, a representative list of such works.
3. Your address, telephone number, and email address.
4. A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.`
      }
    },
    'Contact': {
      icon: <Mail className="w-5 h-5 text-purple-400" />,
      ko: {
        title: "문의하기 (Contact)",
        body: `질문, 버그 제보, 또는 기능 제안이 있으신가요?
아래의 이메일로 언제든지 연락주시기 바랍니다:

✉️ support@dealirious-app.local

이 서비스는 1인 개발자에 의해 유지보수 되고 있으며, 주말을 제외하고 48시간 내에 답변 드리기 위해 노력하고 있습니다.`
      },
      en: {
        title: "Contact Us",
        body: `Got a question, bug report, or feature request? 
Feel free to reach out to our support channel:

✉️ support@dealirious-app.local

Dealirious is maintained by an independent developer. We aim to respond to all inquiries within 48 hours during regular business days.`
      }
    }
  };

  const curr = content[document][language];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                {content[document].icon}
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">{curr.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar">
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-[11px] sm:text-xs leading-relaxed text-gray-300 bg-transparent border-0 p-0 m-0 w-full overflow-hidden">
                {curr.body}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 sm:p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all"
            >
              {language === 'ko' ? '닫기' : 'Close'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
