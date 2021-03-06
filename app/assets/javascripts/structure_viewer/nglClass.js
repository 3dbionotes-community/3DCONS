var self;

function __init_local(i,v_c,v_t,local_flag){
	var __name = i.name.substring(0, 4).toLowerCase();
	if(local_flag)__name=i.name;
        self.model = 0;
	self.Structures[ __name ] = { obj:i, representations:{'selection':{},'keep_selection':{}} };
	self.Structures[ __name ]['representations']['hetero'] = i.addRepresentation("ball+stick",{sele:"/0 and hetero and not water",visible:true});
	self.Structures[ __name ]['representations']['nucleic'] = i.addRepresentation("trace",{sele:"/0 and dna or rna",visible:true,color:"orange"});
        self.Structures[ __name ]['representations']['cartoon']  = i.addRepresentation("cartoon",{visible:v_c,color:"#B9B9B9",sele:"/0 and protein"});
        self.Structures[ __name ]['representations']['trace'] = i.addRepresentation("trace",{visible:v_t,color:"#B9B9B9",sele:"/0 and protein"});
        self.Structures[ __name ]['representations']['selection']['cartoon'] = i.addRepresentation("cartoon",{visible:false,sele:"/0 and protein",color:"#FFE999"});
	self.Structures[ __name ]['representations']['selection']['spacefill'] = i.addRepresentation("spacefill",{visible:false,sele:"/0 and protein",color:"#FFE999"});
	self.Structures[ __name ]['representations']['selection']['ball+stick'] = i.addRepresentation("ball+stick",{visible:false,sele:"/0 and protein",color:"#FFE999"});

        self.stage.autoView();
}

function __init(i,v_c,v_t,local_flag){
	var __name = i.name.substring(0, 4).toLowerCase();
	if(local_flag)__name=i.name;
	self.Structures[ __name ] = { obj:i, representations:{'selection':{},'keep_selection':{}} };
	self.Structures[ __name ]['representations']['hetero'] = i.addRepresentation("ball+stick",{sele:"hetero and not water",visible:true});
	self.Structures[ __name ]['representations']['nucleic'] = i.addRepresentation("trace",{sele:"dna or rna",visible:true,color:"orange"});
        self.Structures[ __name ]['representations']['cartoon']  = i.addRepresentation("cartoon",{visible:v_c,color:"#B9B9B9",sele:"protein"});
        self.Structures[ __name ]['representations']['trace'] = i.addRepresentation("trace",{visible:v_t,color:"#B9B9B9",sele:"protein"});
        self.Structures[ __name ]['representations']['selection']['cartoon'] = i.addRepresentation("cartoon",{visible:false,sele:"protein",color:"#FFE999"});
	self.Structures[ __name ]['representations']['selection']['spacefill'] = i.addRepresentation("spacefill",{visible:false,sele:"protein",color:"#FFE999"});
	self.Structures[ __name ]['representations']['selection']['ball+stick'] = i.addRepresentation("ball+stick",{visible:false,sele:"protein",color:"#FFE999"});

        self.stage.autoView();
}

function initLocalStructure(i){
	__init_local(i,true,false,true);
	__trigger_alignment();
	__clear_message();
}

function initChain(i){
	__init(i,true,false);
	__clear_message();
}

function initStructure(i){
	__init(i,false,true);
	if( self.__load_ready ){
                if(self.args.init_chain)self.highlight_chain(self.args.init_chain.pdb,self.args.init_chain.ch);
		__trigger_alignment();
		__clear_message();
	}
	
}

function initMap(i){
        self.Structures[ 'density' ] = { obj:i, surface:{} };
        self.Structures[ 'density' ]['surface'] = i.addRepresentation( "surface", {
                opacity: 0.2,
                flatShaded:false,
                background:false,
                opaqueBack:false,
		isolevel:5
        });
        self.stage.autoView();
        __clear_em_message();
}

function __show_message(id){
	$j(".ngl_loading").css('display','block');
	$j(".ngl_loading").html("LOADING <b style=\"color:black;\">"+id+"</b>" );
}

function __clear_message(){
	$j(".ngl_loading").css('display','none');
	$j(".ngl_loading").empty();
}

function __show_em_message(id){
	$j(".ngl_em_loading").css('display','block');
	$j(".ngl_em_loading").html( "LOADING <b style=\"color:black;margin-right:10px;\">"+id+"</b><img src=\"/images/loading_em.gif\" />" );
}

function __clear_em_message(){
	$j(".ngl_em_loading").css('display','none');
	$j(".ngl_em_loading").empty();
}


function __trigger_alignment(){
	setTimeout(function(){
                console.log("viewer ready");
		/*var __d = JSON.parse( window.top.$j('#alignment > option:nth-child(2)').val() );
		if( 'uniprot' in __d ){
			window.top.$j('#alignment > option:nth-child(2)').prop('selected', true);
			window.top.$j('#alignment').trigger('change');
		}*/
	},1000);
}

function nglClass( args ) {
	self = this;
	self.stage = null;
	self.Structures = {};
	self.selected = {pdb:'',chain:'',residues:[]};
	self.args = args;
        self.model = -1;
	self.__load_ready = false;
        self.keep_selected = [];

        NGL.mainScriptFilePath = "/ngl/ngl.js";
        document.addEventListener( "DOMContentLoaded", function(){

        	self.stage = new NGL.Stage( self.args.id );
        	self.stage.setParameters( {backgroundColor: "white"} );
		var __n = 1;
		if(self.args.origin == "local"){
                        __show_message( "FILE" );
			self.stage.loadFile( "/upload/"+self.args.pdb_list[0]+"/"+self.args.pdb_list[1] ).then( initLocalStructure );
		}else{

			self.args.pdb_list.forEach(function(pdb_code){

				if( __n == self.args.pdb_list.length ) self.__load_ready = true;
                                __show_message( pdb_code.toUpperCase() );
                                //var url_file = "http://mmtf.rcsb.org/v1.0/full/"+pdb_code.toUpperCase();
                                var url_file = "rcsb://"+pdb_code.toUpperCase()+".mmtf";
                                self.stage.loadFile(  url_file, {ext:"mmtf", firstModelOnly:true} ).then( initStructure ).catch( function(e){
                                  console.error(e);
                                  var url_file = "rcsb://"+pdb_code.toUpperCase()+".cif";
                                  self.stage.loadFile(  url_file, {ext:"cif", firstModelOnly:true} ).then( initStructure );
                                });
				__n++;
			});
		}
		if( self.args.emdb ){
			var __emdb = self.args.emdb.replace("EMD-", "emd_");
                        __show_em_message( self.args.emdb );
                        var __map = "http://www.ebi.ac.uk/pdbe/static/files/em/maps/"+__emdb+".map.gz"
			self.stage.loadFile( __map, {useWorker: true} ).then( initMap );
		}
        	self.stage.viewer.container.addEventListener( "dblclick", function(){
            		self.stage.toggleFullscreen();
        	});
		if(self.args.pdb_list.length == 0)__trigger_alignment();

                self.stage.signals.clicked.add( function( pickingProxy ){
                  if( pickingProxy && pickingProxy.atom && pickingProxy.shiftKey ){
                      var atom = pickingProxy.atom;
                      var cp = pickingProxy.canvasPosition;
                      var chain = $j("#chain_selector").val();
                      var current_iter = parseInt($j("#iter_selector").val());
                      var seq_index = globals.mapping[ chain ]["inverse"][atom.resno]
                      var a = globals.pdb_descritpion[ chain ]["scores"][current_iter][seq_index]["a"];
                      var c1 = parseInt(a*255/4 );
                      if(c1>255)c1=255;
                      var c2 = 255-c1;
                      var col = "rgb(255,"+c2+","+c2+")";
                      self.color_by_chain_simple([atom.resno], globals.pdb, chain, col);
                      if(atom.chainname != chain){
                        swal({
                          title: "UNKNOWN RESIDUE",
                          text: "THE RESIDUE IS NOT LOCATED IN THE CURRENT CHAIN",
                          timer: 5000,
                          type: "error",
                          showConfirmButton: true
                        });
                        console.log( atom );
                        console.log( "atom.chainid = "+atom.chainid );
                        return;
                      }
                      if(seq_index>=0){
                        mark_row(seq_index+1);
                      }else{
                        swal({
                          title: "SELECTION ERROR",
                          text: "SEQUENCE ALIGNMENT OUT OF RANGE",
                          timer: 5000,
                          type: "error",
                          showConfirmButton: true
                        });
                      }
                  }else if( pickingProxy && pickingProxy.shiftKey ){
                      console.log("No residue selected");
                  }
                });
        });

	self.resize = function( new_size ){
	};

	self.color_by_chain = function( CH_list, non_exec ){
	};

	self.display_message = function(message,non_exec){
	};

        self.play = function(){
          var x = self.model;
          var intervalID = setInterval(function () {
            self.change_model(1);
            if (++x === 2*self.args.n_models) {
              window.clearInterval(intervalID);
            }
          }, 100);
        }

	self.change_model = function(flag){
                var aux = self.model+flag;
                if(aux<0) {
                  aux = self.args.n_models-1;
                }
                if(aux == self.args.n_models){
                  aux = 0;
                }
                if( aux >=0 && aux < self.args.n_models){
		  self.model = aux;
                  self.highlight_chain( self.selected.pdb, self.selected.chain );
                  var evt = document.createEvent("CustomEvent");
                  evt.initCustomEvent("modelChange",true,true,[aux+1]);
                  window.top.document.dispatchEvent(evt);
                  top.document.getElementById("upRightBottomFrame").contentWindow.dispatchEvent(evt);
                }else{
                  connsole.log("!!!!!!!");
                }
	}

        self.color_by_conservation = function( pdb, chain, non_exec  ){
                if(!self.Structures[pdb]) return;
                if(self.selected.residues.length > 0){
		  for (type in self.Structures[ self.selected.pdb ]['representations']['selection']){
		    self.Structures[ self.selected.pdb ]['representations']['selection'][type].setVisibility(false);
		  }
                }
                var model_flag = '';
                if(self.model>=0) model_flag = 'and /'+self.model.toString()+' '; 
		for(__pdb in self.Structures){
			if(__pdb != self.selected.pdb && __pdb != 'density'){
				self.Structures[ __pdb ]['representations']['trace'].setVisibility(true);
				self.Structures[ __pdb ]['representations']['cartoon'].setVisibility(false);
			}
		}
		self.Structures[ pdb ]['representations']['trace'].setSelection("protein "+model_flag+"and not :"+chain);
		self.Structures[ pdb ]['representations']['cartoon'].setSelection("protein "+model_flag+"and :"+chain);
		self.Structures[ pdb ]['representations']['cartoon'].setVisibility(true);

                var conservation_colors = [];
                var current_iter = parseInt($j("#iter_selector").val()); 
                _.each(globals.pdb_descritpion[ chain ]["scores"][current_iter], function(i){ 
                  var c1 = parseInt(i["a"]*255/4 );
                  if(c1>255)c1=255
                  var c2 = 255-c1;
                  var col = "rgb(255,"+c2+","+c2+")";
                  var res_id = globals.mapping[chain]['align'][ parseInt(i["index"])-1 ];
                  if(res_id) conservation_colors.push( [col,res_id.toString()] );
                });
                var schemeId = NGL.ColormakerRegistry.addSelectionScheme( conservation_colors, "conservation" );
                self.Structures[ pdb ]['representations']['cartoon'].setColor(schemeId);

		self.selected.pdb = pdb;
		self.selected.chain = chain;
		self.selected.residues = [];
	};

	self.color_by_chain_simple = function( list, __pdb, chain, __color, non_exec ){
		var pdb = __pdb.toLowerCase();
                var color = "#FFE999";
                if(__color)  color = __color;

		if(list.length < 1){
			self.reset_view();
			return;
		}
		if(!pdb in self.Structures) return;

		self.selected.pdb = pdb;
		self.selected.chain = chain;
		self.selected.residues = list;

                var model_flag = '';
                if(self.model>=0) model_flag = 'and /'+self.model.toString()+' '; 

		self.Structures[ pdb ]['representations']['selection']['cartoon'].setSelection( "protein "+model_flag+"and :"+chain+" and ("+list.join(" or ")+")" );
		self.Structures[ pdb ]['representations']['selection']['spacefill'].setSelection( "protein "+model_flag+"and :"+chain+" and ("+list.join(" or ")+")" );
		self.Structures[ pdb ]['representations']['selection']['ball+stick'].setSelection( "protein "+model_flag+"and :"+chain+" and ("+list.join(" or ")+")" );

                self.Structures[ pdb ]['representations']['selection']['cartoon'].setColor(color);
		self.Structures[ pdb ]['representations']['selection']['spacefill'].setColor(color);
		self.Structures[ pdb ]['representations']['selection']['ball+stick'].setColor(color);

		if(list.length>3){
			self.Structures[ pdb ]['representations']['selection']['cartoon'].setVisibility(true);
			self.Structures[ pdb ]['representations']['selection']['ball+stick'].setVisibility(false);
		}else{
			self.Structures[ pdb ]['representations']['selection']['ball+stick'].setVisibility(true);
		}

		if(list.length<13){
			self.Structures[ pdb ]['representations']['selection']['spacefill'].setVisibility(true);
		}else{
 			self.Structures[ pdb ]['representations']['selection']['spacefill'].setVisibility(false);
		}
	};

	self.load_more_atoms = function(pdb,chain,non_exec){
		if(!self.selected.pdb) return;
		if( self.Structures[ pdb ]['representations']['selection']['spacefill'].visible ){	
			self.Structures[ pdb ]['representations']['selection']['spacefill'].setVisibility(false);
		}else{
			self.Structures[ pdb ]['representations']['selection']['spacefill'].setVisibility(true);
		}
	}

	self.draw_sphere = function( radius, non_exec ){
	}

	self.delete_sphere = function( non_exec ){

	}
	
	self.change_sphere_visibility = function(non_exec){

	}

	self.delete_more_atoms = function(non_exec){

	}

	self.hide_hetero = function(non_exec){
		self.show_hetero();
	}

	self.show_hetero = function(non_exec){
		for(__name in self.Structures){
			if( self.Structures[ __name ]['representations'] ){
				if( self.Structures[ __name ]['representations']['hetero'].visible ){
					self.Structures[ __name ]['representations']['hetero'].setVisibility(false);
					self.Structures[ __name ]['representations']['nucleic'].setVisibility(false);
				}else{
					self.Structures[ __name ]['representations']['hetero'].setVisibility(true);
					self.Structures[ __name ]['representations']['nucleic'].setVisibility(true);
				}
			}
		}

	}
	
	self.show_volume = function(non_exec){
		self.Structures[ 'density' ]['surface'].setVisibility(true);
	}
	
	self.hide_volume = function(non_exec){
		self.Structures[ 'density' ]['surface'].setVisibility(false);
	}

	self.highlight_neightbours = function(non_exec){

	}

	self.clear_neightbours = function(non_exec){

	};

	self.highlight_chain = function( pdb, chain, non_exec){
                if(!self.Structures[pdb]) return;
                if(self.selected.residues.length > 0){
		  for (type in self.Structures[ self.selected.pdb ]['representations']['selection']){
		    self.Structures[ self.selected.pdb ]['representations']['selection'][type].setVisibility(false);
		  }
                }
                var model_flag = '';
                if(self.model>=0) model_flag = 'and /'+self.model.toString()+' '; 
		for(__pdb in self.Structures){
			if(__pdb != self.selected.pdb && __pdb != 'density'){
				self.Structures[ __pdb ]['representations']['trace'].setVisibility(true);
				self.Structures[ __pdb ]['representations']['cartoon'].setVisibility(false);
			}
		}
		self.Structures[ pdb ]['representations']['trace'].setSelection("protein "+model_flag+"and not :"+chain);
		self.Structures[ pdb ]['representations']['cartoon'].setSelection("protein "+model_flag+"and :"+chain);
		self.Structures[ pdb ]['representations']['cartoon'].setVisibility(true);

		self.selected.pdb = pdb;
		self.selected.chain = chain;
		self.selected.residues = [];
                self.color_by_conservation(pdb, chain, non_exec);
	};
	
	self.color_chain_by_region = function( REGION_list, non_exec ){

	};

	self.highlight_residues = function( RES_list, non_exec ){

	};
	
	self.display_chains = function( non_exec ){

	};

	self.reset_view = function( non_exec ){
                var pdb = self.selected.pdb;
                var chain = self.selected.chain;
                self.highlight_chain(pdb,chain);
	};

        self.center_view  = function( non_exec  ){
                if(self.stage) self.stage.autoView();
        }

	self.zoom_in = function( non_exec ){

	}

	self.zoom_out = function( non_exec ){

	}
	
	self.clear_selected = function ( non_exec ){
		self.reset_view();
	}

	self.load_surface = function( emd, threshold, maxVolSize, non_exec){
		self.Structures[ 'density' ]['surface'].setParameters( {isolevel:threshold} );
	}

	self.open_url = function( pdb, append_flag, chain, non_exec){
		self.stage.removeAllComponents();
		self.p_chain = chain;
                var pdb_code = pdb;
                __show_message( pdb_code.toUpperCase() );
                var url_file = "http://mmtf.rcsb.org/v1.0/full/"+pdb_code.toUpperCase();
                self.stage.loadFile(  url_file, {ext:"mmtf", firstModelOnly:true, sele:":"+chain} ).then( initChain );
		//self.stage.loadFile( "rcsb://"+pdb , {firstModelOnly:true,sele:":"+chain} ).then( initChain );
	};

	self.write_image = function(){
          self.stage.makeImage( {
                factor: 1,
                antialias: true,
                trim: false,
                transparent: true 
            } ).then( function( blob ){
                NGL.download( blob, "screenshot.png" );
            } );
        };
	
	self.__load_file = function( www_file ){

	};
	
	self.__load_surface = function( file, threshold ){

	};
}
