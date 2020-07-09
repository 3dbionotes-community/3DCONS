class WebController < ApplicationController
  PDB_PSSM_PATH = Settings.PDB_PSSM_PATH
  PDB_PSSM_ZIP = PDB_PSSM_PATH+"pdbOut.zip"
  PDB_PSSM_DB = PDB_PSSM_PATH+"pdb_pssm.db"
  PDB_PSSM_PATH_CAMPINS = Settings.PDB_PSSM_PATH_CAMPINS

  require 'zip'
  require 'rubygems/package'

  def collect_files
    pdb_list = []
    failed_files = ""

    if params[:pdb] && params[:pdb][:list]
      pdb_list.concat params[:pdb][:list].lines.map(&:strip).map(&:chomp)
    end

    file_data = params[:file_list]
    if file_data.respond_to?(:read)
      file_content = file_data.read
      pdb_list.concat file_content.lines.map(&:strip).map(&:chomp)
    else
       logger.error "Bad file_data: #{file_data.class.name}: #{file_data.inspect}"
    end

    if params[:uniref_version]
      uniref_version = params[:uniref_version]
    else
      uniref_version = "uniref100"
    end

    pdb_collection = []
    pdb_list.each do |p|
      if p.length == 6
        x = p.split(":")
        pdb =  x[0].downcase
        ch =  x[1]
        pdb_collection.push( [pdb,ch] )
      else
        pdb_collection.push( [p.downcase,nil] )
      end
    end
    db = SQLite3::Database.new PDB_PSSM_DB
    db_errors = {}
    db.execute( "select * from statusTable;" ) do |r|
      db_errors[r[0]]=r[1];
    end
    pdb_to_id = {}
    pdb_collection.each do |p|
      ch_ = ";"
      if !p[1].nil?
        ch_ = " and chain=\"#{p[1]}\";"
      end
      if pdb_to_id[p[0]].nil?
        pdb_to_id[p[0]] = {}
      end
      flag = 1
      db.execute( "select * from pdbsTable where pdb=\"#{p[0]}\""+ch_ ) do |r|
        pdb_to_id[ p[0] ][ r[1] ] = { 'seq_id'=>r[2] }
        pdb_to_id[ p[0] ][ r[1] ]['statuts'] = {}
        db.execute( "select stepNum,status_#{uniref_version} from pdbChainIterStatus where pdb=\"#{p[0]}\" and chain=\"#{r[1]}\";" ) do |s|
          pdb_to_id[ p[0] ][ r[1] ]['statuts'][s[0]] = s[1]
        end
        flag = 0
      end
      if flag == 1
        pdb = p[0]
        if !p[1].nil?
          pdb += ":"+p[1]
        end
        failed_files += "PDB "+pdb+" NOT FOUND\n"
      end
    end

    file_string = ""
    file_array = []
    pdb_to_id.each do |p,x|
      x.each do |c,y|
        [2,3].each do |i|
          if pdb_to_id[ p ][ c ]['statuts'][i] == 0
            file_string += "pssm/"+p+"_"+c+"_"+i.to_s+".pssm.zip\\n" 
            file_array.push( "pssm/"+p+"_"+c+"_"+i.to_s+".pssm.zip\\n" )
          elsif !pdb_to_id[ p ][ c ]['statuts'][i].nil?
            puts  pdb_to_id[ p ][ c ]['statuts'][i]
            failed_files += p+"_"+c+"_"+i.to_s+".pssm\n"
            failed_files += "\t"+db_errors[ pdb_to_id[ p ][ c ]['statuts'][i] ]+"\n"
          end
        end
      end
    end
    file_string = file_string.chop.chop

    if file_array.length > 5000
      file_string = file_array[0..4999].join("")
      file_string = file_string.chop.chop
      cmd = "cd "+PDB_PSSM_PATH+" && echo \"Too many files. Only 5000 files were compiled\" > pssm/errorlog.txt && printf \""+failed_files+"\" >> pssm/errorlog.txt && printf \"pssm/errorlog.txt\\n"+file_string+"\" | zip -@ -r - && rm pssm/errorlog.txt"
      binary_data = `#{cmd}`     
    else
      cmd = "cd "+PDB_PSSM_PATH+" && printf \""+failed_files+"\" > pssm/errorlog.txt && printf \"pssm/errorlog.txt\\n"+file_string+"\" | zip -@ -r - && rm pssm/errorlog.txt"
      puts(cmd)
      binary_data = `#{cmd}`
    end

    cookies[:download_start] = true
    send_data(binary_data, :type => 'application/zip', :filename => "pssm_files.zip")
  end
end
