import React, { useEffect, useState } from "react";
import { useStore } from "../store/useStore.js";
import { getTotals } from "../store/selectors.js";
import { groupByAccount } from "../../domain/portfolio-core.js";
import { formatAsOf, formatKrw, formatNumber } from "../../app/formatters.js";

const isStaticDeployment = () => !["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const notifStatusLabel = (status) => (status === "success" ? "성공" : status === "skipped" ? "건너뜀" : "실패");

export function AutomationView() {
  const state = useStore((s) => s.portfolio);
  const auth = useStore((s) => s.auth);
  const notification = useStore((s) => s.notification);
  const actions = useStore((s) => s.actions);

  const signedIn = Boolean(auth.signedIn);
  const isStatic = isStaticDeployment();

  // 알림 폼 로컬 상태 (store.notification.settings 를 시드로)
  const [chatId, setChatId] = useState("");
  const [threshold, setThreshold] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [dailyDigest, setDailyDigest] = useState(true);
  useEffect(() => {
    const s = notification.settings || {};
    setChatId(s.telegram_chat_id || "");
    setThreshold(Number(s.large_move_threshold_krw || 0) || "");
    setTelegramEnabled(Boolean(s.telegram_enabled));
    setDailyDigest(s.daily_digest_enabled !== false);
  }, [notification.settings]);

  const [backupStatus, setBackupStatus] = useState("현재 포트폴리오를 JSON으로 내보내고 복원할 수 있습니다");
  const [importSummary, setImportSummary] = useState(
    isStatic ? "엑셀 가져오기는 로컬 환경 전용입니다" : "검증 리포트를 불러오면 가져오기 요약을 표시합니다",
  );
  const [canCommit, setCanCommit] = useState(false);

  const automation = state?.automation || {};
  const storageLabel = signedIn ? "클라우드 저장" : "로컬 저장";
  const reconcile = actions.getReconcileSummary?.() || null;

  const priceLogs = [...(state?.priceUpdateLogs || [])].slice(-20).reverse();
  const notifLogs = notification.logs || [];
  const latestNotif = notifLogs[0];

  const saveNotifications = (event) => {
    event.preventDefault();
    actions.saveNotificationSettings?.({
      telegram_chat_id: String(chatId).trim(),
      telegram_enabled: telegramEnabled,
      daily_digest_enabled: dailyDigest,
      large_move_threshold_krw: Number(threshold || 0),
    })?.catch?.(() => {});
  };

  const findChatId = () => {
    actions.findTelegramChatId?.()?.then?.((id) => { if (id) setChatId(id); }).catch?.(() => {});
  };

  return (
    <section className="detail-grid automation-view" data-view="automation">
      <div className="panel automation-panel notification-panel">
        <div className="section-heading">
          <h2>알림</h2>
          <span>{signedIn ? (telegramEnabled ? "매일 스냅샷 요약을 텔레그램으로 발송" : "알림 꺼짐 · 아래에서 켜세요") : "로그인 후 설정할 수 있어요"}</span>
        </div>
        {!signedIn ? (
          <div className="locked-notice">
            <strong>로그인하면 텔레그램으로 매일 요약을 받을 수 있어요</strong>
            <span>클라우드에 포트폴리오를 저장한 뒤, 자동 기록이 끝나면 총자산·투자손익 요약이 발송됩니다.</span>
          </div>
        ) : (
          <>
            <ol className="notif-guide">
              <li>텔레그램에서 <b>@stocklio_alarm_bot</b>과 대화를 열고 <code>/start</code>를 보냅니다.</li>
              <li>아래 <b>chat id 찾기</b>를 누르면 대화가 자동으로 연결돼요.</li>
              <li><b>텔레그램 알림 사용</b>을 켜고 <b>저장</b> → <b>테스트 메시지</b>로 확인하면 끝.</li>
            </ol>
            <form className="notification-form" onSubmit={saveNotifications}>
              <label><span>텔레그램 chat id</span>
                <input type="text" inputMode="numeric" placeholder="예: 123456789" value={chatId} onChange={(e) => setChatId(e.target.value)} />
                <small>봇과 대화를 시작한 뒤 'chat id 찾기'를 누르면 자동으로 채워집니다.</small>
              </label>
              <label><span>큰 변동 알림 기준 (원)</span>
                <input type="number" min="0" step="10000" placeholder="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
                <small>이 금액 이상 변동한 날에만 발송합니다. 비우거나 0이면 매일 발송.</small>
              </label>
              <label className="toggle-row">
                <input type="checkbox" checked={telegramEnabled} onChange={(e) => setTelegramEnabled(e.target.checked)} />
                <span>텔레그램 알림 사용</span>
              </label>
              <label className="toggle-row">
                <input type="checkbox" checked={dailyDigest} onChange={(e) => setDailyDigest(e.target.checked)} />
                <span>매일 스냅샷 요약 받기</span>
              </label>
              <div className="form-actions inline-actions">
                <button type="submit">저장</button>
                <button className="ghost" type="button" onClick={findChatId}>chat id 찾기</button>
                <button className="secondary" type="button" onClick={() => actions.sendTestNotification?.(String(chatId).trim())?.catch?.(() => {})}>테스트 메시지</button>
              </div>
            </form>
          </>
        )}
        <div className="automation-summary">
          <div><strong>요약 내용</strong><span>총자산, 전일 대비, 투자손익 추정, 입출금 영향, 변동 원인 상위 종목</span></div>
          <div><strong>최근 발송</strong><span>{latestNotif ? `${notifStatusLabel(latestNotif.status)} · ${formatAsOf(latestNotif.sent_at || latestNotif.created_at)}` : "발송 기록이 없습니다"}</span></div>
        </div>
      </div>

      <div className="panel automation-panel">
        <div className="section-heading"><h2>자동 기록</h2><span>가격과 성과 기록</span></div>
        <div className="automation-summary status-summary">
          <div><strong>현재</strong><span>{`${storageLabel} · 스냅샷 ${state?.portfolioSnapshots?.length ?? 0}개 · 보유 ${state?.holdings?.length ?? 0}개 · 예수금 ${(state?.cashBalances || []).length}개`}</span></div>
          <div><strong>실행</strong><span>{`매일 ${automation.snapshotTime || "09:10"} ${automation.timezone || "Asia/Seoul"}`}</span></div>
          <div><strong>마지막 결과</strong><span>{automation.lastRunAt ? `${automation.lastResult || "자동화 실행 완료"} · ${formatAsOf(automation.lastRunAt)}` : (automation.lastResult || "자동 기록 대기 중")}</span></div>
        </div>
        <details className="advanced-section">
          <summary>수동 작업</summary>
          <div className="automation-actions">
            <div>
              <button className="secondary" type="button" onClick={() => actions.refreshPrices?.({ reason: "manual" })?.catch?.(() => {})}>가격 다시 가져오기</button>
              <span>현재가와 USD/KRW를 다시 조회합니다</span>
            </div>
            <div>
              <button className="secondary" type="button" onClick={() => actions.saveTodaySnapshot?.({ reason: "manual" })?.catch?.(() => {})}>오늘 성과 다시 계산</button>
              <span>오늘 성과 기록을 다시 계산합니다</span>
            </div>
          </div>
        </details>
      </div>

      <details className="panel advanced-section automation-advanced-panel">
        <summary>기록과 백업</summary>
        <div className="section-heading"><h2>기록과 백업</h2><span>문제 해결과 데이터 관리</span></div>
        <div className="backup-actions">
          <button type="button" onClick={async () => setBackupStatus(await actions.exportBackup?.())}>JSON 백업</button>
          <label className="file-button">
            JSON 복원
            <input type="file" accept="application/json" onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              const msg = await actions.restoreBackup?.(file);
              if (msg) setBackupStatus(msg);
            }} />
          </label>
          {!isStatic ? (
            <>
              <label className="file-button">
                엑셀 미리보기
                <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  setImportSummary(`${file?.name || ""} 검증 중...`);
                  const res = await actions.previewImport?.(file);
                  if (res) { setImportSummary(res.summary); setCanCommit(res.canCommit); }
                }} />
              </label>
              <button className="secondary" type="button" disabled={!canCommit} onClick={async () => {
                const res = await actions.commitImport?.();
                if (res) { setImportSummary(res.summary); if (res.done) setCanCommit(false); }
              }}>가져오기 확정</button>
              <button className="secondary" type="button" onClick={async () => setImportSummary(await actions.loadImportSummary?.())}>최근 가져오기 검증</button>
            </>
          ) : null}
        </div>
        <div className="automation-list">
          <div><strong>알림 발송 기록</strong><span>최근 발송 상세는 아래 기록에서 확인할 수 있습니다</span></div>
          <div><strong>엑셀 가져오기</strong><span>{importSummary}</span></div>
          <div><strong>검증 리포트</strong><span>{reconcile ? `전체 총자산 ${formatKrw(reconcile.totalValueKrw)} · 계좌 합계 ${formatKrw(reconcile.accountsTotal)} · 차이 ${formatKrw(reconcile.diff)}` : "계좌 총자산과 전체 총자산 검증 대기"}</span></div>
          <div><strong>백업</strong><span>{isStatic ? "JSON 백업과 복원은 현재 브라우저 포트폴리오에 적용됩니다" : backupStatus}</span></div>
        </div>
        <div className="danger-actions">
          <button className="ghost small-button" type="button" onClick={() => { if (window.confirm("현재 포트폴리오 데이터를 비우고 빈 상태로 시작할까요?")) actions.emptyPortfolio?.(); }}>포트폴리오 초기화</button>
          {!isStatic ? <button className="ghost small-button" type="button" onClick={() => actions.loadSampleData?.()}>샘플 데이터 불러오기</button> : null}
        </div>
        <div className="log-grids">
          <div className="table-wrap compact">
            <table>
              <thead><tr><th>시각</th><th>대상</th><th>상태</th><th>가격/환율</th><th>메시지</th></tr></thead>
              <tbody>
                {priceLogs.length ? priceLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatAsOf(log.at)}</td>
                    <td>{log.symbol}</td>
                    <td className={log.status === "success" ? "positive" : "negative"}>{log.status === "success" ? "성공" : "실패"}</td>
                    <td>{log.price ? formatNumber(log.price, 4) : ""}</td>
                    <td>{log.message || log.source || ""}</td>
                  </tr>
                )) : <tr><td colSpan={5}>가격 업데이트 로그가 없습니다</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="table-wrap compact">
            <table>
              <thead><tr><th>시각</th><th>유형</th><th>상태</th><th>메시지</th></tr></thead>
              <tbody>
                {notifLogs.length ? notifLogs.slice(0, 8).map((log) => (
                  <tr key={log.id}>
                    <td>{formatAsOf(log.sent_at || log.created_at)}</td>
                    <td>{log.message_type === "test" ? "테스트" : "일일 요약"}</td>
                    <td className={log.status === "success" ? "positive" : log.status === "error" ? "negative" : ""}>{notifStatusLabel(log.status)}</td>
                    <td>{log.error_message || log.message_preview || ""}</td>
                  </tr>
                )) : <tr><td colSpan={4}>발송 기록이 없습니다</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </section>
  );
}
