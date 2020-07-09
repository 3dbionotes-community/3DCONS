class PssmJsonController < ApplicationController

  require 'net/http'

  PDB_PSSM_PATH = Settings.PDB_PSSM_PATH
  PDB_PSSM_ZIP = PDB_PSSM_PATH+"pdbOut.zip"
  PDB_PSSM_DB = PDB_PSSM_PATH+"pdb_pssm.db" 
  EBI_RES_LISTING_URL = "https://www.ebi.ac.uk/pdbe/api/pdb/entry/residue_listing/"
  PDB_PSSM_PATH_CAMPINS = Settings.PDB_PSSM_PATH_CAMPINS

  def pssm_ch_rest
    pdb = params[:pdb].downcase
    chain =  params[:ch]
    alignment = res_alignment(pdb)    

    pdb_description  =  {}
    db = SQLite3::Database.new PDB_PSSM_DB
    db.execute( "select * from pdbsTable where pdb=\"#{pdb.downcase}\" and chain=\"#{chain}\"" ) do |r|
      pdb_description[ r[1] ] = []
      statuts = [0,0]
      #db.execute( "select stepNum,status from pssmsTableUniref100 where seqId = #{r[2]};" ) do |s|
      db.execute( "select stepNum,status_uniref100 from pdbChainIterStatus where pdb=\"#{pdb.downcase}\" and chain=\"#{chain}\";" ) do |s|
        statuts[ s[0]-2 ] = s[1]
      end
      if statuts[0] == 0
        x, y = get_pssm(pdb.downcase,chain,"2")
        x.each_with_index do |value,index|
          z = value
          z['iter'] = {2=>y[index]}
          pdb_description[ r[1] ].push(z)
        end
      end
      if statuts[1] == 0
        x, y = get_pssm(pdb.downcase,chain,"3")
        y.each_with_index do |value,index|
          pdb_description[ r[1] ][index]['iter'][3]=value
        end
      end
    end
    return render :json => pdb_description[chain]
  end

  def pssm_rest
    pdb = params[:pdb].downcase
    #alignment = res_alignment(pdb)    

    pdb_description  =  {}
    db = SQLite3::Database.new PDB_PSSM_DB
    db.execute( "select * from pdbsTable where pdb=\"#{pdb.downcase}\";" ) do |r|
      pdb_description[ r[1] ] = []
      statuts = [0,0]
      db.execute( "select stepNum,status_uniref100 from pdbChainIterStatus where pdb=\"#{pdb.downcase}\" and chain=\"#{r[1]}\";" ) do |s|
        statuts[ s[0]-2 ] = s[1]
      end
      if statuts[0] == 0
        x, y = get_pssm(pdb.downcase,r[1],"2")
        x.each_with_index do |value,index|
          z = value
          z['iter'] = {2=>y[index]}
          pdb_description[ r[1] ].push(z)
        end
      end
      if statuts[0] == 0 && statuts[1] == 0
        x, y = get_pssm(pdb.downcase,r[1],"3")
        y.each_with_index do |value,index|
          pdb_description[ r[1] ][index]['iter'][3]=value
        end
      end
    end
    return render :json => pdb_description
  end

  def get_pssm(pdb,ch,n)
    cmd = "unzip -p "+PDB_PSSM_PATH+"/pssm/"+pdb+"_"+ch+"_"+n+".pssm.zip"
    file = `#{cmd}`
    out_res = []
    out_scores = []
    index = 1
    file.split("\n").each do |l|
      if l =~ /^(\s+)(\-?)(\d)/
        r = l.split(/\s+/)
        out_res.push( {'index'=>index, 'res_id'=>r[1].to_i,'aa'=>r[2] } )
        out_scores.push( {'pssm'=>r[3..22], 'psfm'=>r[23..42], 'a'=>r[43], 'b'=>r[44] } )
        index += 1
      end
    end
    return out_res,  out_scores
  end

  def res_alignment(pdb)
    url = EBI_RES_LISTING_URL+pdb
    begin
      data = Net::HTTP.get_response(URI.parse(url)).body
    rescue
      puts "Error downloading data:\n#{$!}"
    end
    mapping = {  }
    begin
      ali = JSON.parse(data)
    rescue
      ali = {}
    end
    if ali[pdb]
      ali[pdb]['molecules'].each do |m|
        m['chains'].each do |c|
          if mapping[ c['chain_id'] ].nil?
             mapping[ c['chain_id'] ] = {'align'=>[], 'inverse'=>{}}
          end
          c['residues'].each do |r|
            mapping[ c['chain_id'] ]['align'].push(r['author_residue_number'].to_i)
            mapping[ c['chain_id'] ]['inverse'][ r['author_residue_number']  ] = mapping[ c['chain_id'] ]['align'].length-1
          end 
        end
      end
    end
    return mapping
  end

  def pssm_list_ids
    initial = params[:initial]
    if initial =~ /\A\d+\Z/
      query = "SELECT pdb,chain FROM pdbChainIterStatus WHERE status_uniref100=0 AND pdb LIKE '#{initial}___' GROUP BY pdb,chain;"
    else
      return render :json => {:error => "Bad or missing parameter", :msg => "Please provide PDB Id initial as parameter, e.g. http://3dcons.cnb.csic.es/pssm_json/list/1"}, :status => 400
    end

    pdb_list = []
    db = SQLite3::Database.new PDB_PSSM_DB
    db.execute(query) do |r|
      pdb = {"pdbId" => r[0], "chainId" => r[1]}
      pdb_list.push(pdb)
    end
    return render :json => {"KnownPdbIds": pdb_list}
  end

end
