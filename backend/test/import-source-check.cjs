const fs=require('node:fs');
const path=require('node:path');
const {PrismaClient}=require('@prisma/client');
const {ImportService}=require('../dist/imports/import.service');
const directory=process.argv[2];
if(!directory)throw Error('Pass the read-only XLSX export directory');
const prisma=new PrismaClient();
(async()=>{
 const service=new ImportService(prisma);
 for(const file of fs.readdirSync(directory).filter(f=>f.endsWith('.xlsx'))){
  try {
   const preview=await service.previewImport({buffer:fs.readFileSync(path.join(directory,file)),originalname:file},1);
   console.log(JSON.stringify({periods:preview.periods.length,ready:preview.periods.filter(p=>p.year&&p.revenue!==null&&p.sourceRating!==null&&!p.issues.some(i=>i.severity==='error')&&!p.rows.some(r=>r.issue||!r.metricId)).length,warnings:preview.warnings,issues:preview.periods.flatMap(p=>p.issues).slice(0,5)}));
  }catch(e){console.log(JSON.stringify({error:e.message}));}
 }
})().finally(()=>prisma.$disconnect());
