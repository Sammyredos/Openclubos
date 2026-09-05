import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import 'verify_email_screen.dart';

class RegistrationScreen extends ConsumerStatefulWidget {
  const RegistrationScreen({super.key});

  @override
  ConsumerState<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends ConsumerState<RegistrationScreen> {
  int _currentStep = 1;

  // Form Controllers
  final _firstNameController = TextEditingController(text: '');
  final _lastNameController = TextEditingController(text: '');
  final _emailController = TextEditingController(text: '');
  final _passwordController = TextEditingController(text: '');
  final _confirmPasswordController = TextEditingController(text: '');

  final _handicapController = TextEditingController(text: '');
  final _homeClubController = TextEditingController(text: '');
  final _dobController = TextEditingController(text: '');

  final _phoneController = TextEditingController(text: '');
  final _cityController = TextEditingController(text: '');
  final _stateController = TextEditingController(text: '');
  final _scrollController = ScrollController();

  // Interactive UI States
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _selectedClassification;
  bool _noHandicapIndex = false;
  String _selectedGender = '';
  String? _avatarUrl;
  bool _pushNotifications = true;
  bool _agreedToRules = false;
  bool _agreedToMarkerDuty = false;
  bool _isLoading = false;
  String? _errorMessage;

  // Selected Country & Dial Code
  String _selectedCountryCode = 'NG';
  String _selectedPhoneCode = '234';
  String _selectedCountryFlag = '🇳🇬';
  String _selectedCountryName = 'Nigeria';

  final List<Map<String, String>> _allCountries = const [
    {'code': 'NG', 'name': 'Nigeria', 'dial': '234', 'flag': '🇳🇬'},
    {'code': 'US', 'name': 'United States', 'dial': '1', 'flag': '🇺🇸'},
    {'code': 'GB', 'name': 'United Kingdom', 'dial': '44', 'flag': '🇬🇧'},
    {'code': 'CA', 'name': 'Canada', 'dial': '1', 'flag': '🇨🇦'},
    {'code': 'GH', 'name': 'Ghana', 'dial': '233', 'flag': '🇬🇭'},
    {'code': 'KE', 'name': 'Kenya', 'dial': '254', 'flag': '🇰🇪'},
    {'code': 'ZA', 'name': 'South Africa', 'dial': '27', 'flag': '🇿🇦'},
    {'code': 'AE', 'name': 'United Arab Emirates', 'dial': '971', 'flag': '🇦🇪'},
    {'code': 'AU', 'name': 'Australia', 'dial': '61', 'flag': '🇦🇺'},
    {'code': 'IE', 'name': 'Ireland', 'dial': '353', 'flag': '🇮🇪'},
    {'code': 'FR', 'name': 'France', 'dial': '33', 'flag': '🇫🇷'},
    {'code': 'DE', 'name': 'Germany', 'dial': '49', 'flag': '🇩🇪'},
    {'code': 'ES', 'name': 'Spain', 'dial': '34', 'flag': '🇪🇸'},
    {'code': 'IT', 'name': 'Italy', 'dial': '39', 'flag': '🇮🇹'},
    {'code': 'IN', 'name': 'India', 'dial': '91', 'flag': '🇮🇳'},
    {'code': 'JP', 'name': 'Japan', 'dial': '81', 'flag': '🇯🇵'},
    {'code': 'CN', 'name': 'China', 'dial': '86', 'flag': '🇨🇳'},
    {'code': 'BR', 'name': 'Brazil', 'dial': '55', 'flag': '🇧🇷'},
    {'code': 'MX', 'name': 'Mexico', 'dial': '52', 'flag': '🇲🇽'},
    {'code': 'EG', 'name': 'Egypt', 'dial': '20', 'flag': '🇪🇬'},
    {'code': 'RW', 'name': 'Rwanda', 'dial': '250', 'flag': '🇷🇼'},
    {'code': 'UG', 'name': 'Uganda', 'dial': '256', 'flag': '🇺🇬'},
    {'code': 'TZ', 'name': 'Tanzania', 'dial': '255', 'flag': '🇹🇿'},
  ];

  // Custom Brand Colors
  static const Color kGreenInputBg = Color(0xFFF5FAF6);
  static const Color kGreenInputBorder = Color(0xFFE1EFE5);
  static const Color kGreenActiveBorder = Color(0xFFD1E7D8);
  static const Color kTournamentEmerald = Color(0xFF009A60);
  static const Color kTextDark = Color(0xFF111827);
  static const Color kTextLabel = Color(0xFF0F172A);
  static const Color kTextMuted = Color(0xFF5B6B7F);
  static const Color kTextHint = Color(0xFF8CA0BA);
  static const Color kPillBg = Color(0xFFEEF2F6);

  bool _showClubSuggestions = false;

  final List<Map<String, String>> _allGolfCourses = [
    {'name': 'Oakwood Country Club Course', 'location': 'Augusta, GA • 18 Holes'},
    {'name': 'Augusta National Golf Club', 'location': 'Augusta, GA • 18 Holes'},
    {'name': 'Pinehurst Resort No. 2', 'location': 'Pinehurst, NC • 18 Holes'},
    {'name': 'St Andrews Old Course', 'location': 'St Andrews, Fife • 18 Holes'},
    {'name': 'Pebble Beach Golf Links', 'location': 'Pebble Beach, CA • 18 Holes'},
    {'name': 'OpenClub Golf Club 2 Course', 'location': 'City 2 • 18 Holes'},
    {'name': 'OpenClub Golf Club 3 Course', 'location': 'City 3 • 18 Holes'},
    {'name': 'OpenClub Golf Club 4 Course', 'location': 'City 4 • 18 Holes'},
    {'name': 'OpenClub Golf Club 5 Course', 'location': 'City 5 • 18 Holes'},
    {'name': 'OpenClub Golf Club 6 Course', 'location': 'City 6 • 18 Holes'},
    {'name': 'OpenClub Golf Club 7 Course', 'location': 'City 7 • 18 Holes'},
    {'name': 'OpenClub Golf Club 8 Course', 'location': 'City 8 • 18 Holes'},
    {'name': 'OpenClub Golf Club 9 Course', 'location': 'City 9 • 18 Holes'},
    {'name': 'OpenClub Golf Club 10 Course', 'location': 'City 10 • 18 Holes'},
    {'name': 'OpenClub Golf Club 11 Course', 'location': 'City 11 • 18 Holes'},
    {'name': 'OpenClub Golf Club 12 Course', 'location': 'City 12 • 18 Holes'},
    {'name': 'OpenClub Golf Club 13 Course', 'location': 'City 13 • 18 Holes'},
    {'name': 'OpenClub Golf Club 14 Course', 'location': 'City 14 • 18 Holes'},
    {'name': 'OpenClub Golf Club 15 Course', 'location': 'City 15 • 18 Holes'},
    {'name': 'OpenClub Golf Club 16 Course', 'location': 'City 16 • 18 Holes'},
    {'name': 'OpenClub Golf Club 17 Course', 'location': 'City 17 • 18 Holes'},
    {'name': 'OpenClub Golf Club 18 Course', 'location': 'City 18 • 18 Holes'},
    {'name': 'OpenClub Golf Club 19 Course', 'location': 'City 19 • 18 Holes'},
    {'name': 'OpenClub Golf Club 20 Course', 'location': 'City 20 • 18 Holes'},
  ];

  static const Map<String, List<String>> _nigerianStatesLgas = {
    'Abia': ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umunneochi'],
    'Adamawa': ['Demsa', 'Fufure', 'Ganye', 'Gayuk', 'Gombi', 'Grie', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South'],
    'Akwa Ibom': ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono-Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat-Enin', 'Nsit-Atai', 'Nsit-Ibom', 'Nsit-Ubium', 'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung-Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo'],
    'Anambra': ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'],
    'Bauchi': ['Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa', 'Giade', 'Itas/Gadau', "Jama'are", 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'],
    'Bayelsa': ['Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'],
    'Benue': ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Ohimini', 'Oju', 'Okpokwu', 'Otukpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya'],
    'Borno': ['Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa', 'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga', 'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar', 'Monguno', 'Ngala', 'Nganzai', 'Shani'],
    'Cross River': ['Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala'],
    'Delta': ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West'],
    'Ebonyi': ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaozara', 'Ohaukwu', 'Onicha'],
    'Edo': ['Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba Okha', 'Orhionmwon', 'Oredo', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde'],
    'Ekiti': ['Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure', 'Gbonyin', 'Ido Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye'],
    'Enugu': ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South', 'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi', 'Uzo Uwani'],
    'FCT': ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council'],
    'Gombe': ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'],
    'Imo': ['Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West', 'Unuimo'],
    'Jigawa': ['Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin Hausa', 'Kaugama', 'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi'],
    'Kaduna': ['Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', "Jema'a", 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'],
    'Kano': ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'],
    'Katsina': ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dandume', 'Danja', 'Dan Musa', 'Daura', 'Dutsi', 'Dutsin Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada', "Mai'Adua", 'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa', 'Safana', 'Sandamu', 'Zango'],
    'Kebbi': ['Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru'],
    'Kogi': ['Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela Odolu', 'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa Muro', 'Ofu', 'Ogori/Magongo', 'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'],
    'Kwara': ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'],
    'Lagos': ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
    'Nasarawa': ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawa', 'Nasarawa Egon', 'Obi', 'Toto', 'Wamba'],
    'Niger': ['Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Moya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi'],
    'Ogun': ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Odeda', 'Odogbolu', 'Ogun Waterside', 'Remo North', 'Shagamu'],
    'Ondo': ['Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'],
    'Osun': ['Atakunmosa East', 'Atakunmosa West', 'Aiyedaade', 'Aiyedire', 'Boluwaduro', 'Boripe', 'Ede North', 'Ede South', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Egbedore', 'Ejigbo', 'Ifedayo', 'Ifelodun', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo'],
    'Oyo': ['Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire', 'Oyo', 'Oyo East', 'Saki East', 'Saki West', 'Surulere'],
    'Plateau': ['Bokkos', 'Barkin Ladi', 'Bassa', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang South', 'Langtang North', 'Mangu', 'Mikang', 'Pankshin', "Qua'an Pan", 'Riyom', 'Shendam', 'Wase'],
    'Rivers': ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emuoha', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'],
    'Sokoto': ['Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'],
    'Taraba': ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim Lamido', 'Kumi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'],
    'Yobe': ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani', 'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa', 'Yunusari', 'Yusufari'],
    'Zamfara': ['Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Chafe', 'Zurmi'],
  };

  // Reactive step completion validation getters
  bool get _isStep1Valid {
    final first = _firstNameController.text.trim();
    final last = _lastNameController.text.trim();
    final email = _emailController.text.trim();
    final pass = _passwordController.text;
    final confirm = _confirmPasswordController.text;
    return first.isNotEmpty &&
        last.isNotEmpty &&
        email.contains('@') &&
        email.contains('.') &&
        pass.length >= 8 &&
        pass == confirm;
  }

  bool get _isStep2Valid {
    final hcp = _handicapController.text.trim();
    final dob = _dobController.text.trim();
    return (_selectedClassification != null) &&
        (_selectedClassification == 'PROFESSIONAL' ||
            (_selectedClassification == 'BEGINNER' && hcp.isNotEmpty) ||
            (_selectedClassification == 'AMATEUR' && hcp.isNotEmpty && double.tryParse(hcp) != null)) &&
        _selectedGender.isNotEmpty &&
        dob.isNotEmpty;
  }

  bool get _isStep3Valid {
    final phone = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    final city = _cityController.text.trim();
    final state = _stateController.text.trim();
    return phone.length >= 7 && city.isNotEmpty && state.isNotEmpty;
  }

  bool get _isStep4Valid {
    return _agreedToRules && _agreedToMarkerDuty;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _handicapController.dispose();
    _homeClubController.dispose();
    _dobController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToTop() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0.0,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // Password strength calculation (0 to 4)
  int _calculatePasswordStrength(String password) {
    if (password.isEmpty) return 0;
    int strength = 0;
    if (password.length >= 8) strength++;
    if (RegExp(r'[A-Z]').hasMatch(password) && RegExp(r'[a-z]').hasMatch(password)) strength++;
    if (RegExp(r'[0-9]').hasMatch(password)) strength++;
    if (RegExp(r'[!@#\$&*~%^+=]').hasMatch(password)) strength++;
    return strength;
  }

  Future<void> _nextStep() async {
    setState(() {
      _errorMessage = null;
    });

    if (_currentStep == 1) {
      if (_firstNameController.text.trim().isEmpty || _lastNameController.text.trim().isEmpty) {
        setState(() => _errorMessage = 'Please enter your full first and last name.');
        return;
      }
      if (!_emailController.text.contains('@') || !_emailController.text.contains('.')) {
        setState(() => _errorMessage = 'Please provide a valid email address.');
        return;
      }
      if (_passwordController.text.length < 8) {
        setState(() => _errorMessage = 'Password must be at least 8 characters.');
        return;
      }
      if (_calculatePasswordStrength(_passwordController.text) < 4) {
        setState(() => _errorMessage = 'Password is too weak. Please make it stronger before moving to the next step.');
        return;
      }
      if (_passwordController.text != _confirmPasswordController.text) {
        setState(() => _errorMessage = 'Passwords do not match.');
        return;
      }

      setState(() => _isLoading = true);
      try {
        final authService = ref.read(authServiceProvider);
        final valRes = await authService.validatePlayer(email: _emailController.text.trim());
        if (valRes['available'] == false) {
          if (mounted) {
            setState(() {
              _errorMessage = valRes['message'] ?? 'An account with this email already exists. Please sign in or use a different email.';
              _isLoading = false;
            });
          }
          return;
        }
      } catch (_) {
        // Continue if network error
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }

    if (_currentStep == 3) {
      final phone = _phoneController.text.replaceAll(RegExp(r'\D'), '');
      if (phone.length < 7) {
        setState(() => _errorMessage = 'Please enter a valid mobile phone number.');
        return;
      }
      if (_cityController.text.trim().isEmpty || _stateController.text.trim().isEmpty) {
        setState(() => _errorMessage = 'Please select your state and city / LGA.');
        return;
      }

      final fullPhone = '+${_selectedPhoneCode}${phone.replaceFirst(RegExp(r'^0+'), '')}';
      setState(() => _isLoading = true);
      try {
        final authService = ref.read(authServiceProvider);
        final valRes = await authService.validatePlayer(phone: fullPhone);
        if (valRes['available'] == false) {
          if (mounted) {
            setState(() {
              _errorMessage = valRes['message'] ?? 'This phone number is already registered to another account. Please use a different phone number.';
              _isLoading = false;
            });
          }
          return;
        }
      } catch (_) {
        // Continue if network error
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }

    if (_currentStep < 4) {
      setState(() {
        _currentStep++;
      });
      _scrollToTop();
    }
  }

  void _prevStep() {
    if (_currentStep > 1) {
      setState(() {
        _errorMessage = null;
        _currentStep--;
      });
      _scrollToTop();
    } else {
      Navigator.of(context).pop();
    }
  }

  Future<void> _handleCompleteRegistration() async {
    if (!_agreedToRules || !_agreedToMarkerDuty) {
      setState(() {
        _errorMessage = 'Please accept both rules and marker duty pledges to complete registration.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
        final cleanPhone = _phoneController.text.replaceAll(RegExp(r'\D'), '');
        final fullPhone = _phoneController.text.trim().startsWith('+')
            ? _phoneController.text.trim()
            : '+${_selectedPhoneCode}${cleanPhone.replaceFirst(RegExp(r'^0+'), '')}';

        await authService.registerPlayer({
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
          'name': '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}',
          'handicap': _selectedClassification == 'PROFESSIONAL'
              ? 0.0
              : (_selectedClassification == 'BEGINNER' ? 36.0 : (double.tryParse(_handicapController.text) ?? 18.0)),
          'classification': _selectedClassification ?? 'AMATEUR',
          'isPro': _selectedClassification == 'PROFESSIONAL',
          'gender': _selectedGender,
          'phone': fullPhone,
          'city': _cityController.text.trim(),
          'state': _stateController.text.trim(),
        });

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => VerifyEmailScreen(
              email: _emailController.text.trim(),
              playerName: '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}',
            ),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Column(
              children: [
                // Top Header Navigation & Progress Indicator
                _buildHeader(context),

                // Step Body
                Expanded(
                  child: SingleChildScrollView(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_errorMessage != null) _buildErrorBanner(),
                        if (_currentStep == 1) _buildStep1(context),
                        if (_currentStep == 2) _buildStep2(context),
                        if (_currentStep == 3) _buildStep3(context),
                        if (_currentStep == 4) _buildStep4(context),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- Top Navigation & Segmented Progress Bar ---
  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Circular Back Arrow
              GestureDetector(
                onTap: _prevStep,
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.arrow_back_rounded,
                    size: 18,
                    color: Color(0xFF374151),
                  ),
                ),
              ),

              // Pill Badge: "STEP X OF 4"
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: kPillBg,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'STEP $_currentStep OF 4',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: kTextMuted,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 4-Segment Progress Bar
          Row(
            children: List.generate(4, (index) {
              final stepNumber = index + 1;
              final isCompleted = stepNumber <= _currentStep;
              return Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: index < 3 ? 6 : 0),
                  decoration: BoxDecoration(
                    color: isCompleted ? kTournamentEmerald : const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner() {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFCA5A5)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _errorMessage!,
              style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C), height: 1.3),
            ),
          ),
        ],
      ),
    );
  }

  // --- STEP 1: CREATE PLAYER ACCOUNT ---
  Widget _buildStep1(BuildContext context) {
    final strength = _calculatePasswordStrength(_passwordController.text);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Create Player Account',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: kTextDark,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Enter your personal credentials to compete in verified club tournaments.',
          style: TextStyle(fontSize: 13, color: kTextMuted, height: 1.4),
        ),
        const SizedBox(height: 18),

        // Google Sign-up Button
        OutlinedButton(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Google Sign-up configured for tournament players.')),
            );
          },
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 48),
            backgroundColor: Colors.white,
            side: const BorderSide(color: Color(0xFFE5E7EB), width: 1.2),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildGoogleLogo(),
              const SizedBox(width: 10),
              const Text(
                'Sign up with Google',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF374151)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Divider
        Row(
          children: const [
            Expanded(child: Divider(color: Color(0xFFE5E7EB))),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'OR REGISTER WITH EMAIL',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF94A3B8),
                  letterSpacing: 0.8,
                ),
              ),
            ),
            Expanded(child: Divider(color: Color(0xFFE5E7EB))),
          ],
        ),
        const SizedBox(height: 14),

        // First Name
        _buildLabel('First Name'),
        _buildGreenTextField(
          controller: _firstNameController,
          hintText: 'Alex',
        ),
        const SizedBox(height: 14),

        // Last Name
        _buildLabel('Last Name'),
        _buildGreenTextField(
          controller: _lastNameController,
          hintText: 'Wright',
        ),
        const SizedBox(height: 14),

        // Email Address
        _buildLabel('Email Address'),
        _buildGreenTextField(
          controller: _emailController,
          hintText: 'player@domain.com',
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 14),

        // Password
        _buildLabel('Password'),
        _buildGreenTextField(
          controller: _passwordController,
          hintText: '••••••••••••',
          obscureText: _obscurePassword,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
              size: 18,
              color: const Color(0xFF94A3B8),
            ),
            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
          ),
        ),
        const SizedBox(height: 6),

        // Password Strength Indicator Bar
        Row(
          children: [
            Expanded(
              child: Row(
                children: List.generate(4, (index) {
                  final filled = index < strength;
                  return Expanded(
                    child: Container(
                      height: 3.5,
                      margin: EdgeInsets.only(right: index < 3 ? 4 : 0),
                      decoration: BoxDecoration(
                        color: filled ? kTournamentEmerald : const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(width: 12),
            const Text(
              'MIN. 8 CHARACTERS',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        if (_passwordController.text.isNotEmpty && strength < 4) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              border: Border.all(color: const Color(0xFFFDE68A)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Color(0xFFD97706),
                  size: 16,
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Password meter is not full.\nAdd uppercase, number & symbol to proceed.',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF92400E),
                      height: 1.3,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 14),

        // Confirm Password
        _buildLabel('Confirm Password'),
        _buildGreenTextField(
          controller: _confirmPasswordController,
          hintText: '••••••••••••',
          obscureText: _obscureConfirm,
          suffixIcon: _confirmPasswordController.text.isNotEmpty &&
                  _confirmPasswordController.text == _passwordController.text
              ? const Padding(
                  padding: EdgeInsets.all(12),
                  child: Icon(Icons.check_circle_rounded, color: kTournamentEmerald, size: 20),
                )
              : IconButton(
                  icon: Icon(
                    _obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    size: 18,
                    color: const Color(0xFF94A3B8),
                  ),
                  onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                ),
        ),
        const SizedBox(height: 18),

        // CTA Button
        _buildPrimaryButton(
          label: 'Continue to Golf Profile →',
          onPressed: _isStep1Valid ? _nextStep : null,
        ),
        const SizedBox(height: 16),

        // Sign In Link
        Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Already registered? ',
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              GestureDetector(
                onTap: () => Navigator.of(context).pushReplacementNamed('/login'),
                child: const Text(
                  'Sign In',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: kTournamentEmerald,
                    decoration: TextDecoration.underline,
                    decorationColor: kTournamentEmerald,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showClassificationModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final options = [
              {
                'id': 'BEGINNER',
                'title': 'Beginner',
                'desc': 'New to tournament golf • Standard 36.0 handicap allowance',
                'badge': '',
              },
              {
                'id': 'AMATEUR',
                'title': 'Intermediate / Amateur',
                'desc': 'Official GHIN / USGA index • Net tournament flight play',
                'badge': '',
              },
              {
                'id': 'PROFESSIONAL',
                'title': 'Professional',
                'desc': 'Tour Professional • Championship gross scratch competition',
                'badge': 'PRO',
              },
            ];

            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Drag handle
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Player Classification',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Select your tournament flight level',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF5B6B7F),
                              ),
                            ),
                          ],
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pop(ctx),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: kGreenInputBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: kGreenInputBorder),
                            ),
                            alignment: Alignment.center,
                            child: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF64748B)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    const SizedBox(height: 12),

                    // Options list
                    ...options.map((opt) {
                      final isSelected = _selectedClassification == opt['id'];
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedClassification = opt['id'];
                            if (opt['id'] == 'BEGINNER') {
                              _handicapController.text = '36';
                              _noHandicapIndex = false;
                            } else if (opt['id'] == 'AMATEUR') {
                              _handicapController.text = '';
                              _noHandicapIndex = false;
                            } else if (opt['id'] == 'PROFESSIONAL') {
                              _handicapController.text = '0.0';
                              _noHandicapIndex = false;
                            }
                          });
                          Navigator.pop(ctx);
                        },
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFFE8F5ED) : kGreenInputBg,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isSelected ? kTournamentEmerald : kGreenInputBorder,
                              width: isSelected ? 1.4 : 1.0,
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          opt['title']!,
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: isSelected ? kTournamentEmerald : const Color(0xFF0F172A),
                                          ),
                                        ),
                                        if (opt['badge']!.isNotEmpty) ...[
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: kTournamentEmerald,
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              opt['badge']!,
                                              style: const TextStyle(
                                                fontSize: 9,
                                                fontWeight: FontWeight.w900,
                                                color: Colors.white,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      opt['desc']!,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF5B6B7F),
                                        height: 1.3,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Container(
                                width: 20,
                                height: 20,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isSelected ? kTournamentEmerald : Colors.white,
                                  border: Border.all(
                                    color: isSelected ? kTournamentEmerald : const Color(0xFFCBD5E1),
                                    width: 1.5,
                                  ),
                                ),
                                alignment: Alignment.center,
                                child: isSelected
                                    ? const Icon(Icons.check_rounded, size: 13, color: Colors.white)
                                    : null,
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 6),
                    // Confirm button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kTournamentEmerald,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text(
                          'Confirm Selection',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showCountryPicker(BuildContext context) {
    String searchQuery = '';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filteredCountries = _allCountries.where((c) {
              final q = searchQuery.toLowerCase();
              return c['name']!.toLowerCase().contains(q) ||
                  c['code']!.toLowerCase().contains(q) ||
                  c['dial']!.contains(q.replaceAll('+', ''));
            }).toList();

            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.8,
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Select Country',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'International & Regional Dial Codes',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF5B6B7F),
                              ),
                            ),
                          ],
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pop(ctx),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: kGreenInputBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: kGreenInputBorder),
                            ),
                            alignment: Alignment.center,
                            child: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF64748B)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Search bar
                    Container(
                      height: 42,
                      decoration: BoxDecoration(
                        color: kGreenInputBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kGreenInputBorder),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Row(
                        children: [
                          const Icon(Icons.search_rounded, size: 18, color: Color(0xFF8CA0BA)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              onChanged: (val) => setModalState(() => searchQuery = val),
                              style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
                              decoration: const InputDecoration(
                                hintText: 'Search country name or dial code...',
                                hintStyle: TextStyle(fontSize: 13, color: Color(0xFF8CA0BA)),
                                border: InputBorder.none,
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: ListView.builder(
                        itemCount: filteredCountries.length,
                        itemBuilder: (context, index) {
                          final c = filteredCountries[index];
                          final isSelected = _selectedCountryCode == c['code'];
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedCountryCode = c['code']!;
                                _selectedPhoneCode = c['dial']!;
                                _selectedCountryFlag = c['flag']!;
                                _selectedCountryName = c['name']!;
                                if (c['code'] == 'NG') {
                                  _stateController.text = 'Lagos';
                                  _cityController.text = 'Ikeja';
                                } else {
                                  _stateController.text = c['name']!;
                                  _cityController.text = c['name']!;
                                }
                              });
                              Navigator.pop(ctx);
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFE8F5ED) : kGreenInputBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? kTournamentEmerald : kGreenInputBorder,
                                  width: isSelected ? 1.4 : 1.0,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        c['flag']!,
                                        style: const TextStyle(fontSize: 22),
                                      ),
                                      const SizedBox(width: 12),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            c['name']!,
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                              color: isSelected ? kTournamentEmerald : const Color(0xFF0F172A),
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '+${c['dial']} • ${c['code']}',
                                            style: const TextStyle(fontSize: 12, color: Color(0xFF5B6B7F)),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  if (isSelected)
                                    const Icon(Icons.check_circle_rounded, color: kTournamentEmerald, size: 20),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showPhotoUploadOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Upload Player Photo',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Strict 500KB maximum file size required',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF5B6B7F),
                          ),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pop(ctx),
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: kGreenInputBg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: kGreenInputBorder),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF64748B)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Option 1: Valid photo (< 500KB)
                GestureDetector(
                  onTap: () {
                    Navigator.pop(ctx);
                    setState(() {
                      _avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        backgroundColor: kTournamentEmerald,
                        content: Text('Player headshot uploaded successfully (320 KB <= 500 KB limit).'),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: kGreenInputBg,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: kGreenInputBorder),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8F5ED),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.check_circle_outline_rounded, color: kTournamentEmerald, size: 22),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Select Valid Headshot (320 KB)',
                                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Complies with strict 500KB tournament leaderboard limit',
                                style: TextStyle(fontSize: 11.5, color: Color(0xFF5B6B7F)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Option 2: Over limit photo (> 500KB)
                GestureDetector(
                  onTap: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: Colors.red.shade700,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        content: const Row(
                          children: [
                            Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Photo exceeds strict 500KB limit (1,433 KB). Please choose a file under 500KB.',
                                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF1F2),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFFECDD3)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFE4E6),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.block_rounded, color: Color(0xFFE11D48), size: 22),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Test File Over Limit (1.4 MB)',
                                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: Color(0xFF9F1239)),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Triggers strict > 500KB rejection guard',
                                style: TextStyle(fontSize: 11.5, color: Color(0xFFBE123C)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                if (_avatarUrl != null) ...[
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: () {
                      Navigator.pop(ctx);
                      setState(() => _avatarUrl = null);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Player photo removed.')),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.delete_outline_rounded, color: Color(0xFF64748B), size: 22),
                          SizedBox(width: 12),
                          Text(
                            'Remove Current Photo',
                            style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w500, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  void _showStatePicker(BuildContext context) {
    String searchQuery = '';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filteredStates = _nigerianStatesLgas.keys
                .where((s) => s.toLowerCase().contains(searchQuery.toLowerCase()))
                .toList();

            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.8,
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Select State',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Nigerian States & Federal Capital Territory',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF5B6B7F),
                              ),
                            ),
                          ],
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pop(ctx),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: kGreenInputBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: kGreenInputBorder),
                            ),
                            alignment: Alignment.center,
                            child: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF64748B)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Search bar
                    Container(
                      height: 42,
                      decoration: BoxDecoration(
                        color: kGreenInputBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kGreenInputBorder),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Row(
                        children: [
                          const Icon(Icons.search_rounded, size: 18, color: Color(0xFF8CA0BA)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              onChanged: (val) => setModalState(() => searchQuery = val),
                              style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
                              decoration: const InputDecoration(
                                hintText: 'Search Nigerian states...',
                                hintStyle: TextStyle(fontSize: 13, color: Color(0xFF8CA0BA)),
                                border: InputBorder.none,
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: ListView.builder(
                        itemCount: filteredStates.length,
                        itemBuilder: (context, index) {
                          final stateName = filteredStates[index];
                          final isSelected = _stateController.text.trim() == stateName;
                          final lgas = _nigerianStatesLgas[stateName] ?? [];
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _stateController.text = stateName;
                                if (lgas.isNotEmpty) {
                                  _cityController.text = lgas.first;
                                }
                              });
                              Navigator.pop(ctx);
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFE8F5ED) : kGreenInputBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? kTournamentEmerald : kGreenInputBorder,
                                  width: isSelected ? 1.4 : 1.0,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    stateName,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: isSelected ? kTournamentEmerald : const Color(0xFF0F172A),
                                    ),
                                  ),
                                  if (isSelected)
                                    const Icon(Icons.check_circle_rounded, color: kTournamentEmerald, size: 20),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showCityPicker(BuildContext context) {
    String searchQuery = '';
    final currentState = _stateController.text.trim();
    final availableLgas = _nigerianStatesLgas[currentState] ?? _nigerianStatesLgas['Lagos'] ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filteredLgas = availableLgas
                .where((l) => l.toLowerCase().contains(searchQuery.toLowerCase()))
                .toList();

            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.8,
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Select City / LGA',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'LGAs in $currentState State, Nigeria',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF5B6B7F),
                              ),
                            ),
                          ],
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pop(ctx),
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: kGreenInputBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: kGreenInputBorder),
                            ),
                            alignment: Alignment.center,
                            child: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF64748B)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Search bar
                    Container(
                      height: 42,
                      decoration: BoxDecoration(
                        color: kGreenInputBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kGreenInputBorder),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Row(
                        children: [
                          const Icon(Icons.search_rounded, size: 18, color: Color(0xFF8CA0BA)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              onChanged: (val) => setModalState(() => searchQuery = val),
                              style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
                              decoration: InputDecoration(
                                hintText: 'Search LGAs in $currentState...',
                                hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF8CA0BA)),
                                border: InputBorder.none,
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: ListView.builder(
                        itemCount: filteredLgas.length,
                        itemBuilder: (context, index) {
                          final lgaName = filteredLgas[index];
                          final isSelected = _cityController.text.trim() == lgaName;
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _cityController.text = lgaName;
                              });
                              Navigator.pop(ctx);
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFE8F5ED) : kGreenInputBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? kTournamentEmerald : kGreenInputBorder,
                                  width: isSelected ? 1.4 : 1.0,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        lgaName,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: isSelected ? kTournamentEmerald : const Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '$currentState State, Nigeria',
                                        style: const TextStyle(fontSize: 12, color: Color(0xFF5B6B7F)),
                                      ),
                                    ],
                                  ),
                                  if (isSelected)
                                    const Icon(Icons.check_circle_rounded, color: kTournamentEmerald, size: 20),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  // --- STEP 2: YOUR GOLF PROFILE ---
  Widget _buildStep2(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Your Golf Profile',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: kTextDark,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Used by tournament committees to calculate course handicaps and flight brackets.',
          style: TextStyle(fontSize: 13, color: kTextMuted, height: 1.4),
        ),
        const SizedBox(height: 14),

        // Player Classification Trigger Field
        _buildLabel('Player Classification'),
        GestureDetector(
          onTap: () => _showClassificationModal(context),
          child: AbsorbPointer(
            child: _buildGreenTextField(
              controller: TextEditingController(
                text: _selectedClassification == 'BEGINNER'
                    ? 'Beginner'
                    : _selectedClassification == 'AMATEUR'
                        ? 'Intermediate / Amateur'
                        : _selectedClassification == 'PROFESSIONAL'
                            ? 'Professional'
                            : '',
              ),
              hintText: 'Select player classification...',
              suffixIcon: const Icon(Icons.tune_rounded, color: Color(0xFF94A3B8), size: 18),
            ),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Determines tournament flight bracket and scoring allowances.',
          style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFF8CA0BA)),
        ),
        const SizedBox(height: 14),

        // Conditional Official Handicap Index (Only for Beginner or Intermediate / Amateur; display: none for Professional)
        if (_selectedClassification == 'BEGINNER' || _selectedClassification == 'AMATEUR') ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildLabel('Official Handicap Index'),
              if (_selectedClassification == 'BEGINNER')
                Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5ED),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: kTournamentEmerald.withOpacity(0.2)),
                  ),
                  child: const Text(
                    'Auto-assigned 36.0',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: kTournamentEmerald),
                  ),
                ),
            ],
          ),
          _buildGreenTextField(
            controller: _handicapController,
            hintText: _selectedClassification == 'BEGINNER' ? '36' : 'e.g. 2.4',
            enabled: _selectedClassification != 'BEGINNER',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            suffixIcon: Container(
              margin: const EdgeInsets.only(right: 12),
              alignment: Alignment.centerRight,
              width: 44,
              child: const Text(
                'GHIN',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: kTournamentEmerald,
                  letterSpacing: 1.0,
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
        ],

        // Home Golf Club
        _buildLabel('Home Golf Club'),
        GestureDetector(
          onTap: () => _showClubPickerModal(context),
          child: AbsorbPointer(
            child: _buildGreenTextField(
              controller: _homeClubController,
              hintText: 'Select your home golf club...',
              prefixIcon: const Icon(Icons.location_on_rounded, color: Color(0xFF64748B), size: 18),
              suffixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 18),
            ),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Tap to search or select from registered golf courses.',
          style: TextStyle(
            fontSize: 11,
            fontStyle: FontStyle.italic,
            color: Color(0xFF8CA0BA),
          ),
        ),
        const SizedBox(height: 14),

        // Gender Segmented Control
        _buildLabel('Gender'),
        Container(
          height: 48,
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: kGreenInputBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: kGreenInputBorder, width: 1.2),
          ),
          child: Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedGender = 'MALE'),
                  child: Container(
                    decoration: BoxDecoration(
                      color: _selectedGender == 'MALE' ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(9),
                      border: _selectedGender == 'MALE'
                          ? Border.all(color: kGreenActiveBorder, width: 1.2)
                          : Border.all(color: Colors.transparent, width: 1.2),
                      boxShadow: _selectedGender == 'MALE'
                          ? [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.06),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              )
                            ]
                          : null,
                    ),
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Male',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: _selectedGender == 'MALE' ? kTournamentEmerald : const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Icon(
                          Icons.male_rounded,
                          size: 18,
                          color: _selectedGender == 'MALE' ? kTournamentEmerald : const Color(0xFF64748B),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedGender = 'FEMALE'),
                  child: Container(
                    decoration: BoxDecoration(
                      color: _selectedGender == 'FEMALE' ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(9),
                      border: _selectedGender == 'FEMALE'
                          ? Border.all(color: kGreenActiveBorder, width: 1.2)
                          : Border.all(color: Colors.transparent, width: 1.2),
                      boxShadow: _selectedGender == 'FEMALE'
                          ? [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.06),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              )
                            ]
                          : null,
                    ),
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Female',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: _selectedGender == 'FEMALE' ? kTournamentEmerald : const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Icon(
                          Icons.female_rounded,
                          size: 18,
                          color: _selectedGender == 'FEMALE' ? kTournamentEmerald : const Color(0xFF64748B),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Date of Birth
        _buildLabel('Date of Birth'),
        GestureDetector(
          onTap: () => _openModernDobCalendar(context),
          child: AbsorbPointer(
            child: _buildGreenTextField(
              controller: _dobController,
              hintText: 'MM / DD / YYYY',
              keyboardType: TextInputType.datetime,
              suffixIcon: const Icon(Icons.calendar_today_rounded, color: Color(0xFF94A3B8), size: 18),
            ),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'For Junior / Senior bracket eligibility verification.',
          style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 18),

        // Navigation Buttons Row
        _buildBottomNavButtons(
          nextLabel: 'Continue to Contact →',
          onNext: _isStep2Valid ? _nextStep : null,
        ),
      ],
    );
  }

  // --- STEP 3: PLAYER CONTACT & AVATAR ---
  Widget _buildStep3(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Player Contact & Avatar',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: kTextDark,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Used for live on-course tee time notifications and official pairing scorecards.',
          style: TextStyle(fontSize: 13, color: kTextMuted, height: 1.4),
        ),
        const SizedBox(height: 14),

        // Circular Avatar Upload Container
        Center(
          child: Column(
            children: [
              GestureDetector(
                onTap: () => _showPhotoUploadOptions(context),
                child: Container(
                  width: 130,
                  height: 130,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF7F4),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFC6E8D6),
                      width: 2,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: _avatarUrl != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(65),
                          child: Image.network(
                            _avatarUrl!,
                            width: 130,
                            height: 130,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(Icons.person_rounded, size: 54, color: kTournamentEmerald),
                          ),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.camera_alt_rounded, color: kTournamentEmerald, size: 36),
                            SizedBox(height: 6),
                            Text(
                              'PHOTO',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: kTournamentEmerald,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton(
                    onPressed: () => _showPhotoUploadOptions(context),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(160, 42),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                      elevation: 1,
                      shadowColor: Colors.black.withOpacity(0.04),
                    ),
                    child: Text(
                      _avatarUrl != null ? 'Change Photo' : 'Upload Player Photo',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                    ),
                  ),
                  if (_avatarUrl != null) ...[
                    const SizedBox(width: 8),
                    InkWell(
                      onTap: () {
                        setState(() => _avatarUrl = null);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Player photo removed.')),
                        );
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFFFFF1F2),
                          border: Border.all(color: const Color(0xFFFECDD3)),
                        ),
                        child: const Icon(Icons.close_rounded, size: 18, color: Color(0xFFE11D48)),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 8),
              const SizedBox(
                width: 260,
                child: Text(
                  'High-contrast headshot used on the live clubhouse leaderboard (max 500KB strictly).',
                  style: TextStyle(fontSize: 12, color: Color(0xFF8CA0BA), height: 1.4),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Mobile Phone Number
        _buildLabel('Mobile Phone Number'),
        Row(
          children: [
            // Country Code Selector
            GestureDetector(
              onTap: () => _showCountryPicker(context),
              child: Container(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: kGreenInputBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: kGreenInputBorder, width: 1.2),
                ),
                child: Row(
                  children: [
                    Text(
                      '$_selectedCountryFlag  +$_selectedPhoneCode',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.arrow_drop_down_rounded, color: Color(0xFF8CA0BA), size: 18),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            // Phone Text Input
            Expanded(
              child: _buildGreenTextField(
                controller: _phoneController,
                hintText: _selectedCountryCode == 'NG' ? '803 555 0192' : 'Phone number',
                keyboardType: TextInputType.phone,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text(
          'Used for emergency shotgun and weather sirens.',
          style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 14),

        // State & City / LGA Row
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('State'),
                  GestureDetector(
                    onTap: () => _showStatePicker(context),
                    child: Container(
                      height: 48,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: kGreenInputBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kGreenInputBorder, width: 1.2),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              _stateController.text.isEmpty ? 'Select State' : _stateController.text,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF0F172A),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const Icon(Icons.arrow_drop_down_rounded, color: Color(0xFF8CA0BA), size: 20),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('City / LGA'),
                  GestureDetector(
                    onTap: () => _showCityPicker(context),
                    child: Container(
                      height: 48,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: kGreenInputBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kGreenInputBorder, width: 1.2),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              _cityController.text.isEmpty ? 'Select LGA' : _cityController.text,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF0F172A),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const Icon(Icons.arrow_drop_down_rounded, color: Color(0xFF8CA0BA), size: 20),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Push Notifications Card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 8,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: _pushNotifications
                          ? kTournamentEmerald
                          : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: _pushNotifications
                          ? [
                              BoxShadow(
                                color: kTournamentEmerald.withOpacity(0.25),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Icon(
                      _pushNotifications
                          ? Icons.notifications_active_rounded
                          : Icons.notifications_off_rounded,
                      color: _pushNotifications
                          ? Colors.white
                          : const Color(0xFF94A3B8),
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Push Notifications',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: _pushNotifications
                                    ? const Color(0xFFECFDF5)
                                    : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: _pushNotifications
                                      ? const Color(0xFFA7F3D0)
                                      : const Color(0xFFE2E8F0),
                                ),
                              ),
                              child: Text(
                                _pushNotifications ? 'Enabled' : 'Off',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: _pushNotifications
                                      ? const Color(0xFF065F46)
                                      : const Color(0xFF64748B),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        const Text(
                          'Instant Tee Time & Pairing Alerts',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: Color(0xFF64748B),
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _pushNotifications,
                    activeColor: kTournamentEmerald,
                    activeTrackColor: kTournamentEmerald.withOpacity(0.3),
                    inactiveThumbColor: Colors.white,
                    inactiveTrackColor: const Color(0xFFCBD5E1),
                    onChanged: (val) => setState(() => _pushNotifications = val),
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.only(top: 14, bottom: 12),
                child: Divider(height: 1, color: Color(0xFFF1F5F9)),
              ),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildPushBadge('Pairings'),
                  _buildPushBadge('Tee Times'),
                  _buildPushBadge('Live Scores'),
                  _buildPushBadge('Practice Round'),
                  _buildPushBadge('Leaderboard'),
                  _buildPushBadge('Weather Alerts'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 22),

        // Navigation Buttons Row
        _buildBottomNavButtons(
          nextLabel: 'Review & Finish →',
          onNext: _isStep3Valid ? _nextStep : null,
        ),
      ],
    );
  }

  // --- STEP 4: VERIFY YOUR INFORMATION ---
  Widget _buildStep4(BuildContext context) {
    final first = _firstNameController.text.trim();
    final last = _lastNameController.text.trim();
    final fullName = '$first $last'.trim();
    final isPro = _selectedClassification == 'PROFESSIONAL';
    final firstInitial = first.isNotEmpty ? first[0].toUpperCase() : '';
    final lastInitial = last.isNotEmpty ? last[0].toUpperCase() : '';
    final userInitials = (firstInitial.isNotEmpty || lastInitial.isNotEmpty)
        ? '$firstInitial$lastInitial'
        : 'PL';
    final hcp = _selectedClassification == 'BEGINNER' ? '36.0' : _handicapController.text;
    final club = _homeClubController.text.trim();
    final hcpDisplay = isPro
        ? '0.0 (Scratch)'
        : (_selectedClassification == 'BEGINNER'
            ? '36.0'
            : (hcp.isNotEmpty ? hcp : '18.0'));
    final clubDisplay = club.isNotEmpty ? club : 'None';
    final genderDisplay = _selectedGender == 'MALE'
        ? 'Male'
        : (_selectedGender == 'FEMALE' ? 'Female' : (_selectedGender ?? 'Not specified'));
    final phone = _phoneController.text.trim();
    final emailDisplay = _emailController.text.trim().isNotEmpty ? _emailController.text.trim() : 'None';
    final phoneDisplay = '$_selectedCountryFlag +$_selectedPhoneCode $phone';
    final locationParts = [
      if (_cityController.text.trim().isNotEmpty) _cityController.text.trim(),
      if (_stateController.text.trim().isNotEmpty) _stateController.text.trim(),
      if (_selectedCountryName.isNotEmpty) _selectedCountryName,
    ];
    final locationDisplay = locationParts.isNotEmpty ? locationParts.join(', ') : 'Nigeria';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Verify your Information',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: kTextDark,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Verify your tournament credentials and confirm rules compliance before activation.',
          style: TextStyle(fontSize: 13, color: kTextMuted, height: 1.4),
        ),
        const SizedBox(height: 14),

        // Summary Profile Card
        _buildLabel('Summary Profile Card'),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 6,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Golfer Avatar with Initials + PRO Badge
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: kGreenInputBg,
                        backgroundImage: _avatarUrl != null ? NetworkImage(_avatarUrl!) : null,
                        child: _avatarUrl == null
                            ? Text(
                                userInitials,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: kTournamentEmerald,
                                  letterSpacing: 0.5,
                                ),
                              )
                            : null,
                      ),
                      if (isPro)
                        Positioned(
                          right: -3,
                          bottom: -3,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: kTournamentEmerald,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.white, width: 1.5),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.12),
                                  blurRadius: 2,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: const Text(
                              'PRO',
                              style: TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 0.5,
                                height: 1.0,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Row(
                      children: [
                        Flexible(
                          child: Text(
                            fullName.isEmpty ? 'Alex Wright' : fullName,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0F172A),
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isPro) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: kTournamentEmerald,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'PRO',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 0.5,
                                height: 1.0,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 10),
                child: Divider(color: Color(0xFFF1F5F9), thickness: 1),
              ),
              _buildSummaryDetailRow('HCP Index:', hcpDisplay),
              _buildSummaryDetailRow('Home Club:', clubDisplay),
              _buildSummaryDetailRow('Gender:', genderDisplay),
              _buildSummaryDetailRow('Email:', emailDisplay),
              _buildSummaryDetailRow('Phone:', phoneDisplay),
              _buildSummaryDetailRow('Location:', locationDisplay),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Rules & Attestation Pledge Box
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildLabel('Rules & Attestation Pledge'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
              decoration: BoxDecoration(
                color: (_agreedToRules && _agreedToMarkerDuty)
                    ? const Color(0xFFECFDF5)
                    : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: (_agreedToRules && _agreedToMarkerDuty)
                      ? const Color(0xFFA7F3D0)
                      : const Color(0xFFE2E8F0),
                ),
              ),
              child: Text(
                (_agreedToRules && _agreedToMarkerDuty)
                    ? '2/2 Agreed'
                    : '${(_agreedToRules ? 1 : 0) + (_agreedToMarkerDuty ? 1 : 0)}/2 Required',
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w600,
                  color: (_agreedToRules && _agreedToMarkerDuty)
                      ? const Color(0xFF065F46)
                      : const Color(0xFF64748B),
                ),
              ),
            ),
          ],
        ),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 8,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header inside card
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5ED),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: const Icon(
                      Icons.shield_outlined,
                      color: kTournamentEmerald,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Official Competitor Attestation',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                            letterSpacing: -0.2,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Mandatory compliance for tournament eligibility',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w400,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 10),
                child: Divider(height: 1, color: Color(0xFFF1F5F9)),
              ),

              // Pledge 1
              GestureDetector(
                onTap: () => setState(() => _agreedToRules = !_agreedToRules),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _agreedToRules ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _agreedToRules ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0),
                      width: _agreedToRules ? 1.2 : 1.0,
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        margin: const EdgeInsets.only(top: 2),
                        decoration: BoxDecoration(
                          color: _agreedToRules ? kTournamentEmerald : Colors.white,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: _agreedToRules ? kTournamentEmerald : const Color(0xFFCBD5E1),
                            width: 1.8,
                          ),
                        ),
                        child: _agreedToRules
                            ? const Icon(Icons.check, size: 14, color: Colors.white)
                            : null,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'USGA & R&A RULES',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF64748B),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'I agree to abide by the USGA & R&A Rules of Golf and Tournament Committee local rules.',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: _agreedToRules ? FontWeight.w600 : FontWeight.w400,
                                color: _agreedToRules ? const Color(0xFF0F172A) : const Color(0xFF334155),
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Pledge 2
              GestureDetector(
                onTap: () => setState(() => _agreedToMarkerDuty = !_agreedToMarkerDuty),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _agreedToMarkerDuty ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _agreedToMarkerDuty ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0),
                      width: _agreedToMarkerDuty ? 1.2 : 1.0,
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        margin: const EdgeInsets.only(top: 2),
                        decoration: BoxDecoration(
                          color: _agreedToMarkerDuty ? kTournamentEmerald : Colors.white,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: _agreedToMarkerDuty ? kTournamentEmerald : const Color(0xFFCBD5E1),
                            width: 1.8,
                          ),
                        ),
                        child: _agreedToMarkerDuty
                            ? const Icon(Icons.check, size: 14, color: Colors.white)
                            : null,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'MARKER DUTY • RULE 3.3b',
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF64748B),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'I agree to act as an official score marker for fellow competitors under USGA Rule 3.3b.',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: _agreedToMarkerDuty ? FontWeight.w600 : FontWeight.w400,
                                color: _agreedToMarkerDuty ? const Color(0xFF0F172A) : const Color(0xFF334155),
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),

        // Bottom Nav Buttons
        _buildBottomNavButtons(
          nextLabel: 'Complete Registration →',
          onNext: _isStep4Valid ? _handleCompleteRegistration : null,
          isLoading: _isLoading,
        ),
      ],
    );
  }

  // --- Helper Widget Builders ---
  Widget _buildSummaryDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3.5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPushBadge(String label) {
    return Container(
      height: 26,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xFFEBF7EE),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFBDE3CA)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w500,
          color: Color(0xFF008754),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Color(0xFF0F172A),
          letterSpacing: -0.2,
        ),
      ),
    );
  }

  Widget _buildGreenTextField({
    required TextEditingController controller,
    required String hintText,
    bool obscureText = false,
    bool enabled = true,
    TextInputType? keyboardType,
    Widget? prefixIcon,
    Widget? suffixIcon,
    ValueChanged<String>? onChanged,
  }) {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: enabled ? kGreenInputBg : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kGreenInputBorder, width: 1.2),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        enabled: enabled,
        keyboardType: keyboardType,
        textAlignVertical: TextAlignVertical.center,
        onChanged: (val) {
          if (onChanged != null) onChanged(val);
          setState(() {});
        },
        style: const TextStyle(
          fontSize: 14,
          height: 1.2,
          fontWeight: FontWeight.w500,
          color: Color(0xFF0F172A),
        ),
        decoration: InputDecoration(
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: InputBorder.none,
          hintText: hintText,
          hintStyle: const TextStyle(color: kTextHint, fontSize: 13.5, height: 1.2, fontWeight: FontWeight.w500),
          prefixIcon: prefixIcon,
          suffixIcon: suffixIcon,
        ),
      ),
    );
  }

  Widget _buildCustomCheckbox(bool checked) {
    return Container(
      width: 18,
      height: 18,
      decoration: BoxDecoration(
        color: checked ? kTournamentEmerald : kGreenInputBg,
        borderRadius: BorderRadius.circular(5),
        border: Border.all(
          color: checked ? kTournamentEmerald : kGreenInputBorder,
          width: 1.5,
        ),
      ),
      child: checked
          ? const Icon(Icons.check, size: 14, color: Colors.white)
          : null,
    );
  }

  Widget _buildPrimaryButton({
    required String label,
    required VoidCallback? onPressed,
    bool isLoading = false,
  }) {
    final isEnabled = onPressed != null && !isLoading;
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: isEnabled ? onPressed : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: kTournamentEmerald,
          disabledBackgroundColor: kTournamentEmerald.withOpacity(0.35),
          foregroundColor: Colors.white,
          disabledForegroundColor: Colors.white.withOpacity(0.75),
          elevation: isEnabled ? 2 : 0,
          shadowColor: kTournamentEmerald.withOpacity(0.3),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isEnabled ? Colors.white : Colors.white.withOpacity(0.75),
                ),
              ),
      ),
    );
  }

  Widget _buildBottomNavButtons({
    required String nextLabel,
    required VoidCallback? onNext,
    bool isLoading = false,
  }) {
    return Row(
      children: [
        // Outlined Back Button (Arrow only)
        SizedBox(
          width: 48,
          height: 48,
          child: OutlinedButton(
            onPressed: _prevStep,
            style: OutlinedButton.styleFrom(
              padding: EdgeInsets.zero,
              backgroundColor: Colors.white,
              side: const BorderSide(color: Color(0xFFE5E7EB), width: 1.2),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Icon(
              Icons.arrow_back_rounded,
              size: 20,
              color: Color(0xFF0F172A),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Primary Next / Finish Button
        Expanded(
          child: _buildPrimaryButton(
            label: nextLabel,
            onPressed: onNext,
            isLoading: isLoading,
          ),
        ),
      ],
    );
  }

  void _showClubPickerModal(BuildContext context) {
    final searchController = TextEditingController(text: _homeClubController.text);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final query = searchController.text.trim().toLowerCase();
            final matches = _allGolfCourses.where((c) {
              if (query.isEmpty) return true;
              return c['name']!.toLowerCase().contains(query) ||
                  c['location']!.toLowerCase().contains(query);
            }).toList();

            return Container(
              height: MediaQuery.of(context).size.height * 0.78,
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 16,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'Select Home Golf Club',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Choose your registered course or location',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w400,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF64748B)),
                          onPressed: () => Navigator.pop(ctx),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    // Search bar inside modal
                    Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: kGreenInputBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kGreenInputBorder),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          const Icon(Icons.location_on_rounded, color: kTournamentEmerald, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: searchController,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF0F172A),
                              ),
                              decoration: const InputDecoration(
                                hintText: 'Search golf club or location...',
                                hintStyle: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF8CA0BA),
                                ),
                                border: InputBorder.none,
                                isDense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                              onChanged: (_) => setModalState(() {}),
                            ),
                          ),
                          if (searchController.text.isNotEmpty)
                            GestureDetector(
                              onTap: () {
                                searchController.clear();
                                setModalState(() {});
                              },
                              child: Container(
                                width: 20,
                                height: 20,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFE2E8F0),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.close, size: 12, color: Color(0xFF475569)),
                              ),
                            )
                          else
                            const Icon(Icons.search_rounded, size: 18, color: Color(0xFF94A3B8)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: matches.isEmpty
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: kGreenInputBg,
                                        shape: BoxShape.circle,
                                        border: Border.all(color: kGreenInputBorder),
                                      ),
                                      child: const Icon(Icons.location_off_rounded, size: 22, color: Color(0xFF8CA0BA)),
                                    ),
                                    const SizedBox(height: 10),
                                    const Text(
                                      'No golf clubs found',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF0F172A),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'No registered courses matching "${searchController.text.trim()}".',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w400,
                                        color: Color(0xFF64748B),
                                      ),
                                    ),
                                    if (searchController.text.trim().isNotEmpty) ...[
                                      const SizedBox(height: 14),
                                      ElevatedButton(
                                        onPressed: () {
                                          setState(() {
                                            _homeClubController.text = searchController.text.trim();
                                          });
                                          Navigator.pop(ctx);
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: kTournamentEmerald,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                        ),
                                        child: Text(
                                          'Use "${searchController.text.trim()}" as Home Club',
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            )
                          : ListView.separated(
                              itemCount: matches.length,
                              separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              itemBuilder: (ctx, idx) {
                                final item = matches[idx];
                                final isSelected = _homeClubController.text == item['name'];
                                return InkWell(
                                  borderRadius: BorderRadius.circular(10),
                                  onTap: () {
                                    setState(() {
                                      _homeClubController.text = item['name']!;
                                    });
                                    Navigator.pop(ctx);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: isSelected ? const Color(0xFFE8F5ED) : Colors.transparent,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 32,
                                          height: 32,
                                          decoration: BoxDecoration(
                                            color: isSelected ? kTournamentEmerald : kGreenInputBg,
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: isSelected ? kTournamentEmerald : kGreenInputBorder),
                                          ),
                                          child: Icon(
                                            Icons.location_on_rounded,
                                            size: 16,
                                            color: isSelected ? Colors.white : kTournamentEmerald,
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                item['name']!,
                                                style: const TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w500,
                                                  color: Color(0xFF0F172A),
                                                ),
                                              ),
                                              Text(
                                                item['location']!,
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w400,
                                                  color: Color(0xFF64748B),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (isSelected)
                                          const Icon(Icons.check_rounded, size: 18, color: kTournamentEmerald),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                    if (_homeClubController.text.isNotEmpty) ...[
                      const Divider(height: 1, color: Color(0xFFF1F5F9)),
                      Padding(
                        padding: const EdgeInsets.only(top: 10),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _homeClubController.clear();
                                });
                                Navigator.pop(ctx);
                              },
                              child: const Text(
                                'Clear Selection',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFFEF4444),
                                ),
                              ),
                            ),
                            ElevatedButton(
                              onPressed: () => Navigator.pop(ctx),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: kTournamentEmerald,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              ),
                              child: const Text(
                                'Confirm',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _openModernDobCalendar(BuildContext context) {
    final now = DateTime.now();
    DateTime? selected;
    int viewYear = now.year - 25;
    int viewMonth = 1;

    final parts = _dobController.text.split('/');
    if (parts.length == 3) {
      final m = int.tryParse(parts[0].trim());
      final d = int.tryParse(parts[1].trim());
      final y = int.tryParse(parts[2].trim());
      if (m != null && d != null && y != null) {
        selected = DateTime(y, m, d);
        viewYear = y;
        viewMonth = m;
      }
    }

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final daysInMonth = DateUtils.getDaysInMonth(viewYear, viewMonth);
            final firstWeekday = DateTime(viewYear, viewMonth, 1).weekday % 7;
            final cells = <int?>[];
            for (int i = 0; i < firstWeekday; i++) {
              cells.add(null);
            }
            for (int d = 1; d <= daysInMonth; d++) {
              cells.add(d);
            }

            final isFutureMonth = viewYear > now.year || (viewYear == now.year && viewMonth >= now.month);

            return Container(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Select Date of Birth',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF64748B)),
                          onPressed: () => Navigator.pop(ctx),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      decoration: BoxDecoration(
                        color: kGreenInputBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: kGreenInputBorder),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          InkWell(
                            onTap: () {
                              setModalState(() {
                                if (viewMonth == 1) {
                                  viewMonth = 12;
                                  viewYear--;
                                } else {
                                  viewMonth--;
                                }
                              });
                            },
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: kGreenInputBorder),
                              ),
                              child: const Icon(Icons.chevron_left_rounded, size: 22, color: Color(0xFF1E293B)),
                            ),
                          ),
                          Row(
                            children: [
                              Container(
                                height: 38,
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: kGreenInputBorder),
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<int>(
                                    value: viewMonth,
                                    isDense: true,
                                    icon: const Icon(Icons.arrow_drop_down_rounded, size: 18, color: Color(0xFF64748B)),
                                    items: List.generate(12, (i) {
                                      return DropdownMenuItem(
                                        value: i + 1,
                                        child: Text(
                                          months[i],
                                          style: const TextStyle(
                                            fontSize: 13.5,
                                            fontWeight: FontWeight.w500,
                                            color: Color(0xFF0F172A),
                                          ),
                                        ),
                                      );
                                    }),
                                    onChanged: (v) {
                                      if (v != null) {
                                        setModalState(() => viewMonth = v);
                                      }
                                    },
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                height: 38,
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: kGreenInputBorder),
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<int>(
                                    value: viewYear,
                                    isDense: true,
                                    icon: const Icon(Icons.arrow_drop_down_rounded, size: 18, color: Color(0xFF64748B)),
                                    items: List.generate(100, (i) {
                                      final y = now.year - i;
                                      return DropdownMenuItem(
                                        value: y,
                                        child: Text(
                                          '$y',
                                          style: const TextStyle(
                                            fontSize: 13.5,
                                            fontWeight: FontWeight.w500,
                                            color: Color(0xFF0F172A),
                                          ),
                                        ),
                                      );
                                    }),
                                    onChanged: (v) {
                                      if (v != null) {
                                        setModalState(() => viewYear = v);
                                      }
                                    },
                                  ),
                                ),
                              ),
                            ],
                          ),
                          InkWell(
                            onTap: isFutureMonth
                                ? null
                                : () {
                                    setModalState(() {
                                      if (viewMonth == 12) {
                                        viewMonth = 1;
                                        viewYear++;
                                      } else {
                                        viewMonth++;
                                      }
                                    });
                                  },
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: kGreenInputBorder),
                              ),
                              child: Icon(
                                Icons.chevron_right_rounded,
                                size: 22,
                                color: isFutureMonth ? const Color(0xFFCBD5E1) : const Color(0xFF1E293B),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: const ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) {
                        return Expanded(
                          child: Center(
                            child: Text(
                              w,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF94A3B8),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 8),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 7,
                        mainAxisSpacing: 4,
                        crossAxisSpacing: 4,
                        childAspectRatio: 1.15,
                      ),
                      itemCount: cells.length,
                      itemBuilder: (ctx, idx) {
                        final day = cells[idx];
                        if (day == null) return const SizedBox.shrink();

                        final cellDate = DateTime(viewYear, viewMonth, day);
                        final isFuture = cellDate.isAfter(now);
                        final isSelected = selected != null &&
                            selected!.year == viewYear &&
                            selected!.month == viewMonth &&
                            selected!.day == day;

                        return GestureDetector(
                          onTap: isFuture
                              ? null
                              : () {
                                  setModalState(() {
                                    selected = cellDate;
                                  });
                                },
                          child: Container(
                            decoration: BoxDecoration(
                              color: isSelected ? kTournamentEmerald : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              '$day',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: isFuture
                                    ? const Color(0xFFCBD5E1)
                                    : isSelected
                                        ? Colors.white
                                        : const Color(0xFF1E293B),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildPrimaryButton(
                      label: selected != null
                          ? 'Confirm: ${months[selected!.month - 1]} ${selected!.day}, ${selected!.year}'
                          : 'Select Date',
                      onPressed: selected != null
                          ? () {
                              final formatted =
                                  '${selected!.month.toString().padLeft(2, '0')} / ${selected!.day.toString().padLeft(2, '0')} / ${selected!.year}';
                              setState(() {
                                _dobController.text = formatted;
                              });
                              Navigator.pop(ctx);
                            }
                          : null,
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildGoogleLogo() {
    return SizedBox(
      width: 18,
      height: 18,
      child: CustomPaint(painter: _GoogleIconPainter()),
    );
  }
}

class _GoogleIconPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    const strokeWidth = 3.5;

    final paintRed = Paint()
      ..color = const Color(0xFFEA4335)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final paintYellow = Paint()
      ..color = const Color(0xFFFBBC05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final paintGreen = Paint()
      ..color = const Color(0xFF34A853)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final paintBlue = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final rect = Rect.fromCircle(center: center, radius: size.width / 2.2);

    canvas.drawArc(rect, 3.14 * 0.75, 3.14 * 0.5, false, paintRed);
    canvas.drawArc(rect, 3.14 * 0.25, 3.14 * 0.5, false, paintYellow);
    canvas.drawArc(rect, -3.14 * 0.25, 3.14 * 0.5, false, paintGreen);
    canvas.drawArc(rect, -3.14 * 0.75, 3.14 * 0.5, false, paintBlue);

    final paintBlueFill = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;

    canvas.drawRect(
      Rect.fromLTWH(center.dx - 1, center.dy - 1.8, size.width / 2.1, 3.6),
      paintBlueFill,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
