"""Create/update only the demo data flow and store its callback in Azure (never on disk).

Uses Dataverse's supported workflow API for definition changes. The Power Automate
management endpoint is used only for registration/callback discovery; that
endpoint is not a stable public contract and this setup helper is demo tooling.
"""
import argparse, importlib.util, json, urllib.parse, urllib.request, urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('backend_setup',ROOT/'setup/configure-backend.py')
backend=importlib.util.module_from_spec(spec);spec.loader.exec_module(backend)
ENV='ae00c6cc-145f-41ea-bf30-1f0979a559c6'
CRM='https://rendallandrittner-predev.crm11.dynamics.com'
FLOW='https://api.flow.microsoft.com'
FLOW_ROOT=f'/providers/Microsoft.ProcessSimple/environments/{ENV}/flows'
NAME='Dynamine - Contact data'
META=ROOT/'setup/flows/contact-data-bridge.json'

def call(base,token,path,method='GET',body=None,headers=None):
    req=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,method=method,headers={'Authorization':'Bearer '+token,'Content-Type':'application/json',**(headers or {})})
    try:
        with urllib.request.urlopen(req,timeout=60) as response:
            raw=response.read();return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        # Setup errors can include request payloads/URLs. Only expose the code.
        try:code=json.loads(error.read()).get('error',{}).get('code','unknown')
        except Exception:code='unknown'
        raise RuntimeError(f'{method} setup failed: HTTP {error.code} ({code}). Sensitive response details suppressed.') from None

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--apply',action='store_true');parser.add_argument('--store-callback',action='store_true');args=parser.parse_args()
    if not args.apply and not args.store_callback:
        print('Use --apply to create/update the fixed-site flow; --store-callback activates and stores its private callback in Azure.');return
    crm=backend.token(CRM);flow=backend.token('https://service.flow.microsoft.com/')
    query=urllib.parse.urlencode({'$filter':"name eq '"+NAME+"'",'$select':'workflowid,name,statecode,clientdata'})
    rows=call(CRM,crm,'/api/data/v9.2/workflows?'+query)['value']
    if len(rows)>1:raise RuntimeError('More than one matching bridge flow exists; stop for review.')
    if args.apply:
        reference={'shared_sharepointonline':{'runtimeSource':'embedded','connection':{'connectionReferenceLogicalName':'odevo_sharedsharepointonline_89ee5'},'api':{'name':'shared_sharepointonline'}}}
        clientdata={'properties':{'connectionReferences':reference,'definition':json.loads((ROOT/'setup/flows/contact-data-bridge.definition.json').read_text())},'schemaVersion':'1.0.0.0'}
        if rows:
            wid=rows[0]['workflowid']
            call(CRM,crm,f'/api/data/v9.2/workflows({wid})','PATCH',{'clientdata':json.dumps(clientdata)})
        else:
            row=call(CRM,crm,'/api/data/v9.2/workflows','POST',{'category':5,'name':NAME,'type':1,'primaryentity':'none','description':'Demo backend data bridge using the existing connection, restricted to the two demo lists.','clientdata':json.dumps(clientdata)}, {'Prefer':'return=representation'})
            wid=row['workflowid']
        solution=call(CRM,crm,'/api/data/v9.2/solutions(b13fb656-0cbc-f111-aaae-000d3a8730d1)?$select=uniquename')
        call(CRM,crm,'/api/data/v9.2/AddSolutionComponent','POST',{'ComponentId':wid,'ComponentType':29,'SolutionUniqueName':solution['uniquename'],'AddRequiredComponents':False})
        print('Definition saved in the hackathon solution; workflow '+wid)
    elif rows:wid=rows[0]['workflowid']
    else:raise RuntimeError('Create the bridge flow first.')
    flows=call(FLOW,flow,FLOW_ROOT+'?api-version=2016-11-01')['value']
    matches=[f for f in flows if f.get('properties',{}).get('workflowEntityId')==wid or f.get('properties',{}).get('displayName')==NAME]
    if len(matches)!=1:raise RuntimeError('Flow registration is still pending; rerun after it appears in the solution.')
    fid=matches[0]['name']
    META.write_text(json.dumps({'name':NAME,'environmentId':ENV,'workflowId':wid,'flowId':fid,'designerUrl':f'https://make.powerautomate.com/environments/{ENV}/flows/{fid}?v3=true'},indent=2)+'\n')
    print('Flow registered: '+fid)
    if args.store_callback:
        call(CRM,crm,f'/api/data/v9.2/workflows({wid})','PATCH',{'statecode':1,'statuscode':2})
        result=call(FLOW,flow,FLOW_ROOT+'/'+fid+'/triggers/manual/listCallbackUrl?api-version=2016-11-01','POST',{})
        callback=(result.get('response') or result).get('value')
        if not callback or not callback.startswith('https://') or 'sig=' not in callback:raise RuntimeError('The flow did not return a signed HTTPS callback; nothing stored.')
        arm=backend.token('https://management.azure.com/')
        settings=backend.call(backend.ARM,arm,'/listAppSettings?api-version=2022-03-01','POST',{}).get('properties') or {}
        settings['CAPTURE_FLOW_URL']=callback;settings['CAPTURE_STORAGE_MODE']='flow'
        backend.call(backend.ARM,arm,'/config/appsettings?api-version=2022-03-01','PUT',{'properties':settings})
        print('Flow enabled; callback stored only in Azure server settings. No callback/secret printed or saved locally.')

if __name__=='__main__':
    try:main()
    except Exception as e:
        print(str(e) if isinstance(e,RuntimeError) else 'Setup failed; sensitive details suppressed.');raise SystemExit(1)
