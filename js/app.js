// variables globales et parametres
let url = "http://webmmi.iut-tlse3.fr/~jean-marie.pecatte/serveurRESTCovoiturage/public/";
let membreConnecte = null;
if(localStorage.getItem("membreConnecte") !== null){
	membreConnecte = localStorage.getItem("membreConnecte"); // le membre connecté
}
let idIti ; // l'itinéraire en cours
let today = new Date();
let dd = today.getDate();
let mm = today.getMonth()+1; //January is 0!
let yyyy = today.getFullYear();
if(dd<10) {
    dd = '0'+dd
} 
if(mm<10) {
    mm = '0'+mm
} 
today = dd + '/' + mm + '/' + yyyy;

Twig.cache(false); // pas de cache pour les vues en mode dev

$(document).ready(function() {
	
	// -- gestion des menus 
	$("#listeDispo").click(listeItinerairesDispo);
	$("#itismembres").click(listeItinerairesMembre);
	$("#ajout").click(formAjout);
	$("#modif").click(listeItinerairesMembre);
	$("#suppr").click(listeItinerairesMembre);
	$("#profil").click(gererProfil);
	$("#mescommentaires").click(listeCommentaires);
	$("#mesreservations").click(listeReservations);
	$("#deconnexion").click(membreConnexion);
	$("#inscription").click(membreInscription);
	$("#recher").click(rechercheItineraires);
	// --  affichage des itineraires sur la page d'accueil
	// -- trigger -> simule un click sur le bouton 
	$("#listeDispo").trigger('click');
});

// -------------- bouton annuler ----------------------
function annuler(e) {
	$("#contenu").html("");
}
// ==================  ITINERAIRES ===================

// --- liste des itineraires dispos => requete AJAX
function listeItinerairesDispo(e) {
	e.preventDefault();
	$.get(url+"itineraires", null, afficheItineraires, "json");
}
// --- affichage des itineraires en utilisant la vue
function afficheItineraires(donnees) {
	var itiHTML = Twig.twig({ href: "templates/listeItineraires.twig", async: false}).render({"itis" : donnees});
	$("#contenu").html(itiHTML);
	$(".reserv").click(reserverIti);
	$(".details").click(detailIti);
}

// --- recherche d'itinéraires
// --- affichage du formulaire
function rechercheItineraires(e) {
	e.preventDefault();
	var itiHTML = Twig.twig({ href: "templates/rechercheItineraires.twig", async: false}).render();		
	$("#contenu").html(itiHTML);
	$("#rechercherIti").click(chercheItineraires)
}
// --- recherche dans la BD
// --- requete AJAX
function chercheItineraires(e) {
	e.preventDefault();
	let urlRecherche = url+"itineraires?lieudepart="+$("#lieudepart").val()+"&lieuarrivee="+$("#lieuarrivee").val()+"&datedepart="+$("#datedepart").val()+"&heuredepart="+$("#heuredepart").val()+"&idmembre="+membreConnecte;
	$.get(urlRecherche,null, afficheItineraires, "json");
}


// --- liste des itineraires du membre connecté (s'il y en a un)
// --- requete AJAX
function listeItinerairesMembre(e) {
	e.preventDefault();
	if (membreConnecte==null) {
		membreConnexion(e);
	} else {
		$.get(url+"membres/"+membreConnecte+"/itineraires", null, afficheItinerairesMembre, "json");
	}
}
// --- affichage des itineraires en utilisant la vue
function afficheItinerairesMembre(itis) {
	var itiHTML = Twig.twig({ href: "templates/listeItinerairesmembre.twig", async: false}).render({ "itis": itis});		
	$("#contenu").html(itiHTML);

	// gestionnaire d'événement des boutons modifier et supprimer
	$(".modifiti").click(modifierIti);
	$(".suppriti").click(supprimerIti);
}
// ----------------------  DETAILS d'un itinéraire -----------------*/
function detailIti(e) {
	e.preventDefault();
	idIti = e.target.id;
	$.get(url+"itineraires/"+idIti, null, afficheDetailIti, "json");
}
function afficheDetailIti(data) {
	var itiHTML = Twig.twig({ href: "templates/detailItineraire.twig", async: false}).render({"itis" : data});		
	$("#contenu").html(itiHTML);
}

/* ---------------------- AJOUT d'un itineraire --------------------*/

// -- affichage du formulaire de saisie avec la vue (si membre connecté)
function formAjout(e){
	e.preventDefault();
	if (membreConnecte==null) {
		membreConnexion(e);
	} else {
		var itiHTML = Twig.twig({ href: "templates/ajoutItineraire.twig", async: false}).render();		
		$("#contenu").html(itiHTML);
		$("#formAjout").click(ajouter);
	}
}
// --- ajout du nouvel itineraire => requete AJAX
function ajouter(e) {
	e.preventDefault();
	let bagagesauto = $('input[name=bagagesautorises]:radio:checked').val();
	let bagagesautoInt = bagagesauto?1:0;

	let ajoutIti = {'idmembre': membreConnecte,'lieudepart': $("#lieudepart").val(),'lieuarrivee': $("#lieuarrivee").val(),
	'datedepart': $("#datedepart").val(),'heuredepart': $("#heuredepart").val(),'tarif': $("#tarif").val(),'nbplaces':+$("#nbplaces").val(),
	'bagagesautorises': bagagesautoInt,'details': $("#details").val() };
	console.log(ajoutIti);
	
	$.post(url+"itineraires", ajoutIti, messageAjouter, "json");
}
// --- affichage du message d'état suite à l'ajout dans la BD
function messageAjouter(data) {
	console.log(data);
	$.get(url+"itineraires", null, afficheItineraires, "json");
	if(data.status == false){
		$("#message").html("ERREUR : " + data.message);
	}
	else{
		$("#message").html("Itinéraire ajouté.");
	}
}
/* ---------------------- SUPPRESSION d'un itineraire --------------------*/
// --- affichage d'une popup de confirmation
// --- et si confirmation alors suppression ==> requete AJAX
function supprimerIti(e) {
	e.preventDefault();
	if (membreConnecte==null) {
		membreConnexion(e);
	} else {
		if (confirm("Êtes-vous sûr de vouloir supprimer l'itinéraire d'id " + $(this).attr('id') + " ?")){
			$.ajax({
				url: url+"itineraires/"+$(this).attr('id'),
				type: 'DELETE',
				success: messageSupprimer
			});
		}
	}
}
// --- affichage du message d'état suite à la suppression
function messageSupprimer(data) {
	console.log(data);
	$.get(url+"itineraires", null, afficheItineraires, "json");
	if(data.status == false){
		$("#message").html("ERREUR : " + data.message);
	}
	else{
		$("#message").html("Itinéraire supprimé.");
	}
}
/* ---------------------- MODIFICATION d'un itineraire --------------------*/
// --- recupération des caract de l'itinéraire ==> requete AJAX
function modifierIti(e) {
	e.preventDefault();

	if (membreConnecte==null) {
		membreConnexion(e);
	} else {
		idIti = e.target.id;
		$.get(url+"itineraires/"+idIti, null, modifAffichValeurs, "json");
	}
}
// --- afficher les valeurs de l'itineraire à modifier dans un formulate ==> vue
function modifAffichValeurs(data) {
	var itiHTML = Twig.twig({ href: "templates/modifItinerairesmembre.twig", async: false}).render({ "iti": data});		
	$("#contenu").html(itiHTML);
	$("#validerModif").click(modifier);
}
// --- modifier l'itinéraire dans la BD ==> requete AJAX
function modifier(e) {
	e.preventDefault();
	if (membreConnecte==null) {
		membreConnexion(e);
	} else {
		if (confirm("Êtes-vous sûr de vouloir modifier l'itinéraire d'id " + $("#iditi").val() + " ?")){

			let bagagesauto = $('input[name=bagagesautorises]:radio:checked').val();
			let bagagesautoInt = bagagesauto?1:0;
			let modifIti = {'idmembre': $("#idmembre").val(),'iditi': $("#iditi").val(),'lieudepart': $("#lieudepart").val(),'lieuarrivee': $("#lieuarrivee").val(),
			'datedepart': $("#datedepart").val(),'heuredepart': $("#heuredepart").val(),'tarif': $("#tarif").val(),'nbplaces':+$("#nbplaces").val(),
			'bagagesautorises': bagagesautoInt,'details': $("#details").val() };
			console.log(modifIti);

			$.ajax({
				url: url+"itineraires",
				type: 'PUT',
				data: modifIti,
				success: messageModifier
			});
		}
	}
	
}
// --- message d'état suite à la modification d'un itinéraire
function messageModifier(data) {
	console.log(data);
	$.get(url+"itineraires", null, afficheItineraires, "json");
	if(data.status == false){
		$("#message").html("ERREUR : " + data.message);
	}
	else{
		$("#message").html("Itinéraire modifié.");
	}
}

//======================== MEMBRE : PROFIL =========================
// ---- modification du profil , recherche dans la BD
//   des carac du membre connecté (s'il y en a un)
function gererProfil(e) {
	e.preventDefault();
	if (membreConnecte==null) {
		membreConnexion(e);
	} else {
		$.get(url+"membres/"+membreConnecte, null, profilAffichValeurs, "json");
	}
}
// --- afficher dans un formulaire du profil du membre ==> vue
function profilAffichValeurs(data) {
	console.log(data);
	var itiHTML = Twig.twig({ href: "templates/membreModifProfil.twig", async: false}).render({ "membre": data});		
	$("#contenu").html(itiHTML);
	$("#validerModifProfil").click(modifierProfil);
}
// ---- modifier le profil dans la BD ==> requete AJAX
function modifierProfil(e) {
	e.preventDefault();
	if (membreConnecte==null) {
		membreConnexion(e);
	} else {
		if (confirm("Êtes-vous sûr de vouloir modifier votre profil ?")){

			let modifProfil = {'idmembre': $("#idmembre").val(),'nom': $("#nom").val(),'prenom': $("#prenom").val(),'email': $("#email").val(),
			'password': $("#password").val(),'anneenaissance': $("#anneenaissance").val(),'voiture': $("#voiture").val(),'telportable':+$("#telportable").val(),
			'sexe': $("#sexe").val() };
			console.log(modifProfil);

			$.ajax({
				url: url+"membres",
				type: 'PUT',
				data: modifProfil,
				success: profilModifier
			});
		}
	}
	
}
// --- message d'état suite à la modif du profil
function profilModifier(data) {
	$.get(url+"itineraires", null, afficheItineraires, "json");
	if(data.status == false){
		$("#message").html("ERREUR : " + data.message);
	}
	else{
		$("#message").html("Profil modifié.");
	}
}
//======================== MEMBRE : CONNEXION =========================
// ----  affichage du formulaire de connexion
function membreConnexion() {
	
	if (membreConnecte == null) {
		var connexionHTML = Twig.twig({ href: "templates/membreConnexion.twig", async: false}).render();		
		$( "#contenu" ).html(connexionHTML);
		$("#connexion").submit(verifConnexion);
	}
	else {
		membreConnecte = null;
		localStorage.setItem("membreConnecte", membreConnecte);
		$("#deconnexion").text("Connexion");
		$("#message").html("Deconnecté !");
		$("#contenu" ).html("")
		$("#inscription").show();
	}
}
// --- vérification des identifiants de connexion ==> requete AJAX
function verifConnexion(e) {
	e.preventDefault();
	if($("#login").val().length == 0 || $("#password").val().length == 0) {
			$("#connexion").addClass("has-error");
			$("div.alert").show("slow").delay(3000).hide("slow");
	}
	else {
		var identifiants = { "login": $("#login").val(), "pass": $("#password").val() };
		$.post(url+'membres/login',identifiants,connexion,"json");
	}
}
// --- affichage du message d'état suite à une tentative de connexion
function connexion(data) {

	if (data.status==false) {
		$("#message").html("Identifiant et/ou mot de passe incorrects !");
		membreConnexion();
	}
	else {
		$("#message").html("Bienvenue "+ data.membre.prenom +' '+ data.membre.nom);
		$("#contenu").html("");
		membreConnecte = data.membre.idmembre;
		if (typeof(Storage) !== "undefined") {
			localStorage.setItem("membreConnecte", membreConnecte);
		}
		$("#deconnexion").text("Deconnexion");
		$("#inscription").hide();
	}
 }
//======================== MEMBRE : INSCRIPTION =========================
// --- affichage du formulaire d'inscription
function membreInscription(e) {
	var itiHTML = Twig.twig({ href: "templates/membreInscription.twig", async: false}).render();		
	$("#contenu").html(itiHTML);
	$("#validerInscription").click(ajouterMembre);
}
function ajouterMembre(e) {
	e.preventDefault();

	let membre = {'nom': $("#nom").val(),'prenom': $("#prenom").val(),'email': $("#email").val(),'password': $("#password").val(),
	'anneenaissance': $("#anneenaissance").val(),'voiture': $("#voiture").val(),'telportable':+$("#telportable").val(),'sexe': $("#sexe").val() };
	console.log(membre);
	
	$.post(url+"membres", membre, membreInscrit, "json");
}
// --- message d'état suite à l'inscription
function membreInscrit(data) {
	console.log(data);
	var identifiants = { "login": data.membre.email, "pass": data.membre.password };
	$.post(url+'membres/login',identifiants,connexion,"json");
	if(data.status == false){
		$("#message").html("ERREUR : " + data.message);
	}
	else{
		$("#message").html("Inscription réussie.");
	}
}


//========================= RESERVATION  : FAIRE UNE ===================
// ------- ajouter la nouvelle réservation dans la BD ==> requete AJAX
function reserverIti(e) {
	e.preventDefault();
	if (membreConnecte==null) {
		membreConnexion(e);
	}
	else {
		donnees = {'idmembre': membreConnecte,'iditi':$(this).attr('id'),'datereservation':today,'nbplacesreservees':1 }
		$.post(url+'reservations',donnees,reservationAjouter,"json");
	}
}
// ---  message d'état suite à une réservation
function reservationAjouter(data) {
	console.log(data);
	$.get(url+"itineraires", null, afficheItineraires, "json");
	if(data.status == false){
		$("#message").html("ERREUR : " + data.message);
	}
	else{
		$("#message").html("Réservation effectuée.");
	}
}
//========================= RESERVATION  : RESERVATIONS du membre connecté ===================
//----  mes reservations ==> requete AJX
function listeReservations(e) {
	e.preventDefault();
	if (membreConnecte==null) {
		membreConnexion(e);
	}
	else {
		$.get(url+"membres/"+membreConnecte+"/reservations", null, afficheReservations, "json");
	}
}
// ---- affichage de mes réservations => vue
function afficheReservations(data) {
	var itiHTML = Twig.twig({ href: "templates/listeReservations.twig", async: false}).render({ "datas": data});		
	$("#contenu").html(itiHTML);
}

//============================= COMMENTAIRES =========
// --- liste des commentaires du membre connecté
function listeCommentaires(e) {
	e.preventDefault();
	if (membreConnecte==null) {
		membreConnexion(e);
	}
	else {
		$.get(url+"membres/"+membreConnecte+"/commentaires", null, afficheCommentaires, "json");
	}
}
// ---- affichage de mes commentaires => vue
function afficheCommentaires(donnees) {
	var itiHTML = Twig.twig({ href: "templates/listeCommentaires.twig", async: false}).render({ "datas": donnees});		
	$("#contenu").html(itiHTML);
}