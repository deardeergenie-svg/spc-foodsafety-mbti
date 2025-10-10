import React, { useMemo, useState, useEffect } from "react";
import QUESTIONS from "./data/fsmbti_mbti40.json";
import TYPES from "./data/fsmbti_types.json";

const BRAND = { primary: "#0F172A" };
const STORAGE = "fsmbti_answers_v3";

function classNames(...a){return a.filter(Boolean).join(" ");}

function Header(){
  return (
    <header className="max-w-3xl mx-auto text-center mt-8 mb-6">
      <h1 className="text-3xl font-extrabold">SPC식품안전문화 MBTI 성향 </h1>
      <p className="text-sm opacity-70 mt-2">본 테스트는 식품안전문화 참여를 위해 기존 MBTI를 응용한 내용이며, 테스트 결과는 익명으로 이 브라우저에만 저장됩니다.</p>
    </header>
  );
}

function Start({onStart,nickname,setNickname,consent,setConsent}){
  return (
    <div className="max-w-xl mx-auto rounded-2xl border bg-white p-6 space-y-4">
      <p>다음 40문항에 1~5점으로 응답해 주세요.</p>
      <button className="px-4 py-2 rounded-xl text-white" style={{background:BRAND.primary}} onClick={onStart}>
  시작하기 </button>
    </div>
  );
}

function Progress({n,t}){
  const pct = Math.round((n/t)*100);
  return (
    <div className="max-w-3xl mx-auto mb-6">
      <div className="flex justify-between text-sm opacity-80 mb-1"><span>진행도</span><span>{n}/{t} ({pct}%)</span></div>
      <div className="w-full bg-gray-200/60 h-2 rounded-full overflow-hidden">
        <div className="h-2" style={{width:`${pct}%`, background:BRAND.primary}}/>
      </div>
    </div>
  );
}

function Question({q,val,onChange}){
  const SCALE = QUESTIONS.scale;
  return (
    <div className="rounded-2xl shadow p-4 md:p-5 bg-white/90 border border-gray-100">
      <p className="font-medium mb-3">{q.id}. {q.text}</p>
      <div className="grid grid-cols-5 gap-2">
        {SCALE.map(s=>(
          <button key={s.value}
            onClick={()=>onChange(q.id,s.value)}
            className={classNames("py-3 px-2 rounded-xl border text-sm md:text-base",
              val===s.value? "text-white border-transparent":"bg-gray-50 hover:bg-gray-100 border-gray-200")}
            style={val===s.value?{background:BRAND.primary}:{}}>
              {s.value}. {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function compute(answers){
  const axes = {EI:0,SN:0,TF:0,JP:0}; const counts={EI:0,SN:0,TF:0,JP:0};
  for(const q of QUESTIONS.items){
    const a = answers[q.id]; if(!a) continue;
    const centered = a - 3; // -2..+2
    const axis = q.axis;
    const left = QUESTIONS.axes.find(ax=>ax.key===axis).left;
    const delta = (q.dir===left)? centered : -centered;
    axes[axis]+=delta; counts[axis]+=1;
  }
  const letters = QUESTIONS.axes.map(ax=> axes[ax.key]>=0 ? ax.left : ax.right);
  const code = letters.join("");
  const normalized = {};
  for(const k of Object.keys(axes)){
    const maxAbs = (counts[k]*2) || 1;
    // fix JS syntax for OR
  }
  return {code, axes, counts};
}

function computeNormalized(axes,counts){
  const out={};
  for(const k of Object.keys(axes)){
    const maxAbs = counts[k]*2 || 1;
    out[k] = (axes[k]+maxAbs)/(2*maxAbs);
  }
  return out;
}

function Bars({normalized}){
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {QUESTIONS.axes.map(ax=>(
        <div key={ax.key} className="p-4 rounded-2xl border bg-white">
          <div className="flex justify-between text-sm opacity-80 mb-2">
            <span>{ax.left}</span><span className="font-semibold">{ax.title}</span><span>{ax.right}</span>
          </div>
          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
            <div className="h-3" style={{width:`${Math.round((normalized[ax.key]??0.5)*100)}%`, background:BRAND.primary}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShareLinkQR(){
  const [copied,setCopied]=useState(false);
  const url = typeof window!=="undefined" ? window.location.href : "";
  const qr = url? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}` : "";
  const copy = async()=>{ try{ await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),1200);}catch{}};
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border">
      <div className="hidden sm:block">{qr? <img src={qr} alt="QR" className="w-24 h-24"/> : <div className="w-24 h-24 grid place-items-center text-xs opacity-60">배포 후 QR</div>}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm opacity-80 truncate">{url||"배포 후 링크 표시"}</p>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-1 rounded-lg border" onClick={copy}>{copied? "링크 복사됨!":"링크 복사"}</button>
          {qr && <a className="px-3 py-1 rounded-lg border" href={qr} download>QR 다운로드</a>}
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [answers,setAnswers]=useState(()=>{ try{ return JSON.parse(localStorage.getItem(STORAGE)||"{}"); }catch{return {}} });
  const [started,setStarted]=useState(false);
  const [show,setShow]=useState(false);
  const [nickname,setNickname]=useState("");
  const [consent,setConsent]=useState(false);
  useEffect(()=>localStorage.setItem(STORAGE,JSON.stringify(answers)),[answers]);

  const answered = Object.keys(answers).length;
  const {code, axes, counts} = useMemo(()=>compute(answers),[answers]);
  const normalized = useMemo(()=>computeNormalized(axes,counts),[axes,counts]);
  const info = TYPES[code] || {title:"유형 해석 준비중", summary:"", tip:""};

  return (
    <div className="min-h-screen pb-16">
      <Header/>
      <main className="max-w-3xl mx-auto px-4 space-y-6">
        {!started && <Start onStart={()=>setStarted(true)} nickname={nickname} setNickname={setNickname} consent={consent} setConsent={setConsent}/>}

        {started && <Progress n={answered} t={QUESTIONS.items.length}/>}

        {started && !show && (
          <div className="space-y-4">
            {QUESTIONS.items.map(q=>(
              <Question key={q.id} q={q} val={answers[q.id]} onChange={(id,val)=>setAnswers(prev=>({...prev,[id]:val}))}/>
            ))}
            <div className="flex gap-3 justify-end pt-2">
              <button className="px-4 py-2 rounded-xl border bg-white" onClick={()=>{setAnswers({}); setShow(false); setStarted(false);}}>처음으로</button>
              <button disabled={answered<QUESTIONS.items.length} className="px-4 py-2 rounded-xl text-white disabled:opacity-50" style={{background:BRAND.primary}} onClick={()=>setShow(true)}>결과 보기</button>
            </div>
          </div>
        )}

        {started && show && (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 space-y-4">
              <h2 className="text-2xl font-bold">{nickname? `${nickname}님의 결과: `:"결과: "} {code} — {info.title}</h2>
              <Bars normalized={normalized}/>
              <div className="space-y-2">
                <p className="font-semibold">성격 요약</p>
                <p className="opacity-90">{info.summary}</p>
                <p className="font-semibold mt-3">식품안전문화 성향 진단</p>
                <p className="opacity-90">{info.tip}</p>
              </div>
              <p className="text-sm opacity-60">※ 교육·캠페인 참여 독려용 테스트입니다.</p>
            </div>
            <div className="rounded-2xl border bg-white/90 p-4 flex flex-wrap gap-2">
              <ShareLinkQR/>
              <button className="px-3 py-2 rounded-lg border" onClick={()=>window.print()}>인쇄하기</button>
            </div>
          </div>
        )}
      </main>
      <style>{`@media print { header{display:none} main{max-width:100%} }`}</style>
    </div>
  );
}
